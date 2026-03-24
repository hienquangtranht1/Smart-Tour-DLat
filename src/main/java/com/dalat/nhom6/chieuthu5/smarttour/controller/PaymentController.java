package com.dalat.nhom6.chieuthu5.smarttour.controller;

import com.dalat.nhom6.chieuthu5.smarttour.config.VNPayConfig;
import com.dalat.nhom6.chieuthu5.smarttour.entity.*;
import com.dalat.nhom6.chieuthu5.smarttour.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Value("${vnp_TmnCode}")
    private String vnp_TmnCode;

    @Value("${vnp_HashSecret}")
    private String vnp_HashSecret;

    @Value("${vnp_PayUrl}")
    private String vnp_PayUrl;

    @Value("${vnp_ReturnUrl}")
    private String vnp_ReturnUrl;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AgencyRepository agencyRepository;

    @Autowired
    private CommissionRepository commissionRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(HttpServletRequest request,
                                           @RequestParam("orderId") Integer orderId,
                                           @RequestParam("amount") long amount) throws UnsupportedEncodingException {

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_OrderInfo = "Thanh toan don hang:" + orderId;
        String vnp_TxnRef = VNPayConfig.getRandomNumber(8) + "-" + orderId;
        String vnp_IpAddr = VNPayConfig.getIpAddress(request);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100)); // x100
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        
        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString())).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString())).append('&');
                hashData.append('&');
            }
        }
        query.setLength(query.length() - 1);
        hashData.setLength(hashData.length() - 1);
        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnp_HashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnp_PayUrl + "?" + queryUrl;

        return ResponseEntity.ok(Map.of("status", "OK", "message", "Tạo link thanh toán VNPAY thành công", "paymentUrl", paymentUrl));
    }

    // Server to Server IPN
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<?> vnpayIPN(HttpServletRequest request) {
        try {
            Map<String, String> fields = new HashMap<>();
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
                String fieldName = params.nextElement();
                String fieldValue = request.getParameter(fieldName);
                if (fieldValue != null && fieldValue.length() > 0) {
                    fields.put(fieldName, fieldValue);
                }
            }

            String vnp_SecureHash = request.getParameter("vnp_SecureHash");
            if (fields.containsKey("vnp_SecureHashType")) fields.remove("vnp_SecureHashType");
            if (fields.containsKey("vnp_SecureHash")) fields.remove("vnp_SecureHash");

            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            for (String fieldName : fieldNames) {
                String fieldValue = fields.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString())).append('&');
                }
            }
            hashData.setLength(hashData.length() - 1);
            String signValue = VNPayConfig.hmacSHA512(vnp_HashSecret, hashData.toString());

            if (signValue.equals(vnp_SecureHash)) {
                String txnRef = request.getParameter("vnp_TxnRef");
                String[] parts = txnRef.split("-");
                if (parts.length < 2) return ResponseEntity.ok("{\"RspCode\":\"01\",\"Message\":\"Order not found\"}");
                
                Integer orderId = Integer.parseInt(parts[1]);
                Order order = orderRepository.findById(orderId).orElse(null);

                if (order != null) {
                    if ("00".equals(request.getParameter("vnp_ResponseCode"))) {
                        if (!"PAID".equals(order.getStatus())) {
                            order.setStatus("PAID");
                            orderRepository.save(order);
                            
                            // ==== GHI NHẬN HOA HỒNG 5% ====
                            BigDecimal revenue = order.getTotalAmount();
                            BigDecimal rate = new BigDecimal("0.05");
                            BigDecimal commissionAmt = revenue.multiply(rate);

                            // Tìm Agency từ service đầu tiên trong đơn
                            Agency agency = null;
                            if (order.getOrderDetails() != null && !order.getOrderDetails().isEmpty()) {
                                agency = order.getOrderDetails().get(0).getService().getAgency();
                            }
                            if (agency != null) {
                                CommissionRecord rec = CommissionRecord.builder()
                                    .order(order)
                                    .agency(agency)
                                    .orderRevenue(revenue)
                                    .commissionRate(rate)
                                    .commissionAmount(commissionAmt)
                                    .status("PAID")
                                    .build();
                                commissionRepository.save(rec);

                                // Thông báo Staff về hoa hồng vừa được ghi nhận
                                Notification nStaff = Notification.builder()
                                    .user(agency.getUser())
                                    .message("Đơn #" + order.getId() + " THANH TOÁN THÀNH CÔNG. Hoa hồng 5% = " + String.format("%,.0f VNĐ", commissionAmt) + " đã nộp hệ thống.")
                                    .type("COMMISSION")
                                    .isRead(false)
                                    .build();
                                notificationRepository.save(nStaff);
                                messagingTemplate.convertAndSend("/topic/staff/notifications", "💰 Hoa hồng đơn #" + order.getId() + ": " + String.format("%,.0f VNĐ", commissionAmt));
                            }

                            // Gửi Notification Socket cho Khách hàng
                            Notification n = Notification.builder()
                                .user(order.getUser())
                                .message("Thanh toán thành công đơn dịch vụ #" + order.getId() + " qua VNPAY Sandbox.")
                                .type("PAYMENT_SUCCESS")
                                .isRead(false)
                                .build();
                            notificationRepository.save(n);
                            messagingTemplate.convertAndSend("/topic/user/notifications/" + order.getUser().getUsername(), "Ting ting! Đơn hàng #" + order.getId() + " thanh toán hoàn tất qua VNPAY.");

                            // Gửi thông báo + Hoa hồng cho Admin
                            List<User> admins = userRepository.findByRole("ADMIN");
                            String commFmt = String.format("%,.0f VNĐ", commissionAmt);
                            for (User admin : admins) {
                                Notification nAdmin = Notification.builder()
                                    .user(admin)
                                    .message("Đơn #" + order.getId() + " đã PAID. Thu hoa hồng 5% = " + commFmt + " từ đại lý " + (agency != null ? agency.getAgencyName() : ""))
                                    .type("COMMISSION")
                                    .isRead(false)
                                    .build();
                                notificationRepository.save(nAdmin);
                            }
                            messagingTemplate.convertAndSend("/topic/admin/notifications", "💰 Thu phí đơn #" + order.getId() + " – Hoa hồng: " + commFmt);

                            return ResponseEntity.ok("{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}");
                        } else {
                            return ResponseEntity.ok("{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}");
                        }
                    } else {
                        return ResponseEntity.ok("{\"RspCode\":\"00\",\"Message\":\"Transaction failed\"}");
                    }
                } else {
                    return ResponseEntity.ok("{\"RspCode\":\"01\",\"Message\":\"Order not found\"}");
                }
            } else {
                return ResponseEntity.ok("{\"RspCode\":\"97\",\"Message\":\"Invalid Checksum\"}");
            }
        } catch (Exception e) {
            return ResponseEntity.ok("{\"RspCode\":\"99\",\"Message\":\"Unknown error\"}");
        }
    }
}
