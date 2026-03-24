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
import jakarta.servlet.http.HttpServletResponse;

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
    private CommissionRepository commissionRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // ── 1. TẠO LINK THANH TOÁN VNPAY ───────────────────────────
    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(HttpServletRequest request,
                                           @RequestParam("orderId") Integer orderId,
                                           @RequestParam("amount") long amount) {
        try {
            String vnp_TxnRef = VNPayConfig.getRandomNumber(8) + "-" + orderId;
            String vnp_IpAddr = VNPayConfig.getIpAddress(request);

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", "2.1.0");
            vnp_Params.put("vnp_Command", "pay");
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount * 100)); // VNPAY nhân 100
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", "Thanhtoandonhang" + orderId); // Không dấu/khoảng trắng
            vnp_Params.put("vnp_OrderType", "other");
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            // Thời gian tạo & hết hạn giao dịch (GMT+7)
            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));
            cld.add(Calendar.MINUTE, 15);
            vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

            // Sắp xếp tham số theo thứ tự ABC rồi build chuỗi ký
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();

            for (String fieldName : fieldNames) {
                String fieldValue = vnp_Params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8).replace("+", "%20");
                    hashData.append(fieldName).append('=').append(encodedValue).append('&');
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                         .append('=').append(encodedValue).append('&');
                }
            }
            // Xóa ký tự & cuối
            hashData.deleteCharAt(hashData.length() - 1);
            query.deleteCharAt(query.length() - 1);

            String vnp_SecureHash = VNPayConfig.hmacSHA512(vnp_HashSecret, hashData.toString());
            String paymentUrl = vnp_PayUrl + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;

            return ResponseEntity.ok(Map.of(
                "status", "OK",
                "paymentUrl", paymentUrl
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi tạo link thanh toán: " + e.getMessage()));
        }
    }

    // ── 2. IPN (Server-to-Server từ VNPAY gọi vào) ────────────
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<?> vnpayIPN(HttpServletRequest request) {
        try {
            Map<String, String> fields = new HashMap<>();
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
                String name = params.nextElement();
                String value = request.getParameter(name);
                if (value != null && !value.isEmpty()) fields.put(name, value);
            }

            String secureHashFromVNPay = fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            for (String name : fieldNames) {
                String value = fields.get(name);
                if (value != null && !value.isEmpty()) {
                    hashData.append(name).append('=')
                            .append(URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20"))
                            .append('&');
                }
            }
            hashData.deleteCharAt(hashData.length() - 1);

            String calculatedHash = VNPayConfig.hmacSHA512(vnp_HashSecret, hashData.toString());

            if (!calculatedHash.equalsIgnoreCase(secureHashFromVNPay)) {
                return ResponseEntity.ok("{\"RspCode\":\"97\",\"Message\":\"Invalid Checksum\"}");
            }

            // Xác thực chữ ký OK → xử lý nghiệp vụ
            String txnRef = request.getParameter("vnp_TxnRef");
            String responseCode = request.getParameter("vnp_ResponseCode");

            String[] parts = txnRef.split("-");
            if (parts.length < 2) return ResponseEntity.ok("{\"RspCode\":\"01\",\"Message\":\"Order not found\"}");

            Integer orderId = Integer.parseInt(parts[parts.length - 1]);
            Order order = orderRepository.findById(orderId).orElse(null);

            if (order == null) return ResponseEntity.ok("{\"RspCode\":\"01\",\"Message\":\"Order not found\"}");
            if ("PAID".equals(order.getStatus())) return ResponseEntity.ok("{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}");

            if ("00".equals(responseCode)) {
                order.setStatus("PAID");
                orderRepository.save(order);

                // Ghi nhận hoa hồng 5%
                BigDecimal revenue = order.getTotalAmount();
                BigDecimal commissionAmt = revenue.multiply(new BigDecimal("0.05"));
                Agency agency = null;
                if (order.getOrderDetails() != null && !order.getOrderDetails().isEmpty()) {
                    agency = order.getOrderDetails().get(0).getService().getAgency();
                }
                if (agency != null) {
                    CommissionRecord rec = CommissionRecord.builder()
                        .order(order).agency(agency).orderRevenue(revenue)
                        .commissionRate(new BigDecimal("0.05"))
                        .commissionAmount(commissionAmt).status("PAID").build();
                    commissionRepository.save(rec);

                    notificationRepository.save(Notification.builder()
                        .user(agency.getUser())
                        .message("Đơn #" + order.getId() + " THANH TOÁN THÀNH CÔNG. Hoa hồng 5% = " + String.format("%,.0f VNĐ", commissionAmt))
                        .type("COMMISSION").isRead(false).build());
                    messagingTemplate.convertAndSend("/topic/staff/notifications", "💰 Hoa hồng đơn #" + order.getId());
                }

                // Thông báo cho khách hàng
                notificationRepository.save(Notification.builder()
                    .user(order.getUser())
                    .message("Thanh toán thành công đơn dịch vụ #" + order.getId() + " qua VNPAY.")
                    .type("PAYMENT_SUCCESS").isRead(false).build());
                messagingTemplate.convertAndSend("/topic/user/notifications/" + order.getUser().getUsername(),
                    "Đơn hàng #" + order.getId() + " thanh toán hoàn tất qua VNPAY!");

                // Thông báo Admin
                for (User admin : userRepository.findByRole("ADMIN")) {
                    notificationRepository.save(Notification.builder()
                        .user(admin)
                        .message("Đơn #" + order.getId() + " PAID. Hoa hồng 5% = " + String.format("%,.0f VNĐ", commissionAmt))
                        .type("COMMISSION").isRead(false).build());
                }
                messagingTemplate.convertAndSend("/topic/admin/notifications", "Thu phí đơn #" + order.getId());

                return ResponseEntity.ok("{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}");
            }
            return ResponseEntity.ok("{\"RspCode\":\"00\",\"Message\":\"Transaction not success\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok("{\"RspCode\":\"99\",\"Message\":\"Unknown error\"}");
        }
    }

    // ── 3. RETURN URL ────────────────────────────────────────────
    // Cập nhật trạng thái đơn hàng NGAY TẠI ĐÂY vì IPN không hoạt động trên localhost
    // (VNPAY server không thể gọi về 127.0.0.1)
    @GetMapping("/vnpay-return")
    public void vnpayReturn(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String responseCode = request.getParameter("vnp_ResponseCode");
        boolean success = "00".equals(responseCode);

        // Cập nhật trạng thái đơn hàng nếu thanh toán thành công
        if (success) {
            try {
                String txnRef = request.getParameter("vnp_TxnRef");
                if (txnRef != null && txnRef.contains("-")) {
                    String[] parts = txnRef.split("-");
                    Integer orderId = Integer.parseInt(parts[parts.length - 1]);
                    Order order = orderRepository.findById(orderId).orElse(null);

                    if (order != null && !"PAID".equals(order.getStatus())) {
                        order.setStatus("PAID");
                        orderRepository.save(order);

                        // Ghi nhận hoa hồng 5%
                        BigDecimal revenue = order.getTotalAmount();
                        BigDecimal commissionAmt = revenue.multiply(new BigDecimal("0.05"));
                        Agency agency = null;
                        if (order.getOrderDetails() != null && !order.getOrderDetails().isEmpty()) {
                            agency = order.getOrderDetails().get(0).getService().getAgency();
                        }
                        if (agency != null) {
                            CommissionRecord rec = CommissionRecord.builder()
                                .order(order).agency(agency).orderRevenue(revenue)
                                .commissionRate(new BigDecimal("0.05"))
                                .commissionAmount(commissionAmt).status("PAID").build();
                            commissionRepository.save(rec);
                        }

                        // Thông báo cho khách hàng
                        notificationRepository.save(Notification.builder()
                            .user(order.getUser())
                            .message("Thanh toán thành công đơn #" + order.getId() + " qua VNPAY.")
                            .type("PAYMENT_SUCCESS").isRead(false).build());

                        // WebSocket notify real-time
                        try {
                            messagingTemplate.convertAndSend(
                                "/topic/user/notifications/" + order.getUser().getUsername(),
                                "Đơn hàng #" + order.getId() + " đã thanh toán thành công!");
                            if (agency != null) {
                                messagingTemplate.convertAndSend("/topic/staff/notifications",
                                    "💰 Đơn #" + order.getId() + " đã PAID!");
                            }
                        } catch (Exception ignored) {}
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Trả HTML trực tiếp để tránh AuthFilter
        String targetUrl = success ? "/user.html?paymentSuccess=true" : "/user.html?paymentFailed=true";
        String color = success ? "#10b981" : "#f43f5e";
        String icon  = success ? "&#10003;" : "&#10007;";
        String msg   = success ? "Thanh toán Thành Công!" : "Thanh toán Thất Bại";
        String sub   = success ? "Đơn hàng đã được xác nhận. Đang quay lại..." : "Giao dịch bị hủy. Đang quay lại...";

        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Kết quả Thanh toán</title></head>" +
            "<body style='font-family:Arial;text-align:center;padding:80px;background:#f8fafc'>" +
            "<div style='background:white;border-radius:20px;padding:3rem;max-width:400px;margin:auto;box-shadow:0 10px 30px rgba(0,0,0,0.1)'>" +
            "<div style='font-size:4rem;color:" + color + ";margin-bottom:1rem'>" + icon + "</div>" +
            "<h2 style='color:" + color + ";margin-bottom:0.5rem'>" + msg + "</h2>" +
            "<p style='color:#64748b'>" + sub + "</p>" +
            "<div style='margin-top:1.5rem;font-size:0.85rem;color:#94a3b8'>Tự động chuyển trang sau 1.5 giây...</div>" +
            "</div>" +
            "<script>setTimeout(function(){window.location.href='" + targetUrl + "';},1500);</script>" +
            "</body></html>";

        response.setContentType("text/html;charset=UTF-8");
        response.getWriter().write(html);
    }
}



