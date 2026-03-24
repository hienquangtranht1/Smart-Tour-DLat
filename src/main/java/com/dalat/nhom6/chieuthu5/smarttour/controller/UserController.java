package com.dalat.nhom6.chieuthu5.smarttour.controller;

import com.dalat.nhom6.chieuthu5.smarttour.entity.*;
import com.dalat.nhom6.chieuthu5.smarttour.repository.OrderRepository;
import com.dalat.nhom6.chieuthu5.smarttour.repository.ServiceRepository;
import com.dalat.nhom6.chieuthu5.smarttour.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.dalat.nhom6.chieuthu5.smarttour.repository.NotificationRepository notificationRepository;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Autowired
    private OrderRepository orderRepository;

    private User getUserFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("USER_ID") != null) {
            Integer userId = (Integer) session.getAttribute("USER_ID");
            return userRepository.findById(userId).orElse(null);
        }
        return null;
    }

    // Lấy thông tin cá nhân dùng để subscribe WebSocket
    @GetMapping("/me")
    public ResponseEntity<?> getMe(HttpServletRequest request) {
        User u = getUserFromSession(request);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("username", u.getUsername(), "email", u.getEmail()));
    }

    // Lấy danh sách Dịch Vụ đã được Admin duyệt
    @GetMapping("/services")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getApprovedServices() {
        List<Service> approvedServices = serviceRepository.findAll().stream()
                .filter(s -> s.getIsApproved() != null && s.getIsApproved() && s.getIsActive() != null && s.getIsActive())
                .collect(Collectors.toList());

        List<Map<String, Object>> result = approvedServices.stream().map(s -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getServiceName());
            map.put("type", s.getServiceType());
            map.put("price", s.getSalePrice());
            map.put("description", s.getDescription() != null ? s.getDescription() : "");
            map.put("imageUrl", s.getImageUrl() != null ? s.getImageUrl() : "https://via.placeholder.com/200");
            map.put("agencyName", s.getAgency().getAgencyName());
            if ("TOUR".equals(s.getServiceType())) {
                map.put("maxPeople", s.getMaxPeople());
                map.put("durationDays", s.getDurationDays());
                map.put("transportation", s.getTransportation());
            } else {
                map.put("openingTime", s.getOpeningTime());
                map.put("closingTime", s.getClosingTime());
                if ("HOTEL".equals(s.getServiceType())) {
                    map.put("availableRooms", s.getAvailableRooms() != null ? s.getAvailableRooms() : 0);
                }
            }
            map.put("mapPoints", s.getMapPoints());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Đặt vòng lặp Order 1 Dịch vụ
    @PostMapping("/book/{serviceId}")
    @Transactional
    public ResponseEntity<?> bookSingleService(
            @PathVariable("serviceId") Integer serviceId,
            @RequestParam(value = "quantity", defaultValue = "1") Integer quantity,
            @RequestParam(value = "bookingDays", defaultValue = "1") Integer bookingDays,
            @RequestParam(value = "bookingDate", required = false) String bookingDateStr,
            @RequestParam(value = "bookingTime", required = false) String bookingTimeStr,
            HttpServletRequest request) {
            
        User user = getUserFromSession(request);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập trước!"));
        }

        Service svc = serviceRepository.findById(serviceId).orElse(null);
        if (svc == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dịch vụ không tồn tại"));
        }

        // Validate Booking Date
        LocalDate bookingDate = null;
        if (bookingDateStr != null && !bookingDateStr.isBlank()) {
            try {
                bookingDate = LocalDate.parse(bookingDateStr);
                if (bookingDate.isBefore(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Ngày đặt không được ở quá khứ!"));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ngày không hợp lệ (YYYY-MM-DD)"));
            }
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn ngày đặt dịch vụ!"));
        }

        // Validate Booking Time (Required cho HOTEL, RESTAURANT, CAFE)
        LocalTime bookingTime = null;
        if (!"TOUR".equals(svc.getServiceType())) {
            if (bookingTimeStr != null && !bookingTimeStr.isBlank()) {
                try {
                    bookingTime = LocalTime.parse(bookingTimeStr);
                    // Check trong khung giờ dịch vụ
                    if (svc.getOpeningTime() != null && svc.getClosingTime() != null) {
                        LocalTime open = LocalTime.parse(svc.getOpeningTime());
                        LocalTime close = LocalTime.parse(svc.getClosingTime());
                        if (bookingTime.isBefore(open) || bookingTime.isAfter(close)) {
                            return ResponseEntity.badRequest().body(Map.of("error",
                                "Giờ đặt phải trong khung giờ: " + svc.getOpeningTime() + " - " + svc.getClosingTime()));
                        }
                    }
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Giờ không hợp lệ (HH:mm)"));
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn giờ đến dịch vụ!"));
            }
        }

        if ("TOUR".equals(svc.getServiceType())) {
            int maxP = svc.getMaxPeople() != null ? svc.getMaxPeople() : 1;
            if (quantity > maxP) {
                return ResponseEntity.badRequest().body(Map.of("error", "Số khách vượt quá quy định (Tối đa " + maxP + " người)"));
            }
            int availableTrips = svc.getAvailableTrips() != null ? svc.getAvailableTrips() : 0;
            if (availableTrips <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rất tiếc! Đã hết số chuyến đi của dịch vụ này!"));
            }
            svc.setAvailableTrips(availableTrips - 1);
            serviceRepository.save(svc);
        } else if ("HOTEL".equals(svc.getServiceType())) {
            int available = svc.getAvailableRooms() != null ? svc.getAvailableRooms() : 0;
            if (quantity > available) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không đủ số lượng phòng trống. Hiện còn: " + available));
            }
            svc.setAvailableRooms(available - quantity);
            serviceRepository.save(svc);
        }

        BigDecimal unitPrice = svc.getSalePrice();
        BigDecimal amount = unitPrice; // Gói cố định cho cả chuyến đi/phòng
        if ("HOTEL".equals(svc.getServiceType())) {
            amount = amount.multiply(BigDecimal.valueOf(bookingDays)); // Cho phép nhân số đêm với Khách sạn
        }

        Order order = Order.builder()
                .user(user)
                .totalAmount(amount)
                .status("PENDING")
                .build();
        
        OrderDetail detail = OrderDetail.builder()
                .order(order)
                .service(svc)
                .quantity(quantity)
                .bookingDays(bookingDays)
                .actualPrice(unitPrice)
                .isRoomReturned(false)
                .applyDate(bookingDate)
                .bookingTime(bookingTime)
                .build();
                
        order.setOrderDetails(List.of(detail));
        
        orderRepository.save(order);

        // CREATE NOTIFICATION FOR STAFF
        User staffUser = svc.getAgency().getUser();
        Notification n = Notification.builder()
                .user(staffUser)
                .message("Có khách hàng (" + user.getUsername() + ") vừa đặt dịch vụ: " + svc.getServiceName())
                .type("ORDER_PENDING")
                .isRead(false)
                .build();
        notificationRepository.save(n);
        messagingTemplate.convertAndSend("/topic/staff/notifications", "Đơn đặt mới: " + svc.getServiceName() + " (" + user.getUsername() + ")");


        return ResponseEntity.ok(Map.of("status", "success", "message", "Đã đặt thành công chờ Đại lý duyệt!"));
    }

    // Lấy danh sách các Đơn đặt của user hiện tại (Để chia tiền/thanh toán hóa đơn)
    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyOrders(HttpServletRequest request) {
        User user = getUserFromSession(request);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập trước!"));
        }

        List<Order> orders = orderRepository.findByUserIdWithDetails(user.getId());
        
        List<Map<String, Object>> result = orders.stream().map(o -> {
            String serviceNames = o.getOrderDetails().stream()
                    .map(d -> d.getService().getServiceName() + " (x" + d.getQuantity() + ")")
                    .collect(Collectors.joining(", "));

            // Lấy ngày giờ đặt từ OrderDetail đầu tiên
            String bookingDateDisplay = "";
            String bookingTimeDisplay = "";
            String endDateDisplay = "";
            if (!o.getOrderDetails().isEmpty()) {
                OrderDetail d = o.getOrderDetails().get(0);
                if (d.getApplyDate() != null) bookingDateDisplay = d.getApplyDate().toString();
                if (d.getBookingTime() != null) bookingTimeDisplay = d.getBookingTime().toString();
                // Tính ngày kết thúc cho TOUR
                if (d.getApplyDate() != null && d.getService() != null
                        && "TOUR".equals(d.getService().getServiceType())
                        && d.getService().getDurationDays() != null) {
                    endDateDisplay = d.getApplyDate().plusDays(d.getService().getDurationDays()).toString();
                }
            }

            Map<String, Object> row = new java.util.HashMap<>();
            row.put("id", o.getId());
            row.put("services", serviceNames);
            row.put("totalAmount", o.getTotalAmount());
            row.put("status", o.getStatus());
            row.put("orderDate", o.getOrderDate() != null ? o.getOrderDate().toString() : "");
            row.put("bookingDate", bookingDateDisplay);
            row.put("bookingTime", bookingTimeDisplay);
            row.put("endDate", endDateDisplay);
            // Số đêm ở lại (cho HOTEL)
            if (!o.getOrderDetails().isEmpty()) {
                OrderDetail d0 = o.getOrderDetails().get(0);
                row.put("bookingDays", d0.getBookingDays() != null ? d0.getBookingDays() : 1);
                row.put("serviceType", d0.getService() != null ? d0.getService().getServiceType() : "");
                row.put("quantity", d0.getQuantity() != null ? d0.getQuantity() : 1);
            }
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleAllExceptions(Exception ex) {
        ex.printStackTrace();
        return ResponseEntity.status(500).body(Map.of(
            "error", "Lỗi Server: " + ex.getClass().getSimpleName() + " - " + ex.getMessage()
        ));
    }
}
