package com.dalat.nhom6.chieuthu5.smarttour.controller;

import com.dalat.nhom6.chieuthu5.smarttour.entity.*;
import com.dalat.nhom6.chieuthu5.smarttour.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired
    private AgencyRepository agencyRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.dalat.nhom6.chieuthu5.smarttour.service.EmailService emailService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CommissionRepository commissionRepository;

    private User getUserFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Integer userId = (Integer) session.getAttribute("USER_ID");
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    private Agency getAgencyFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Integer userId = (Integer) session.getAttribute("USER_ID");
        if (userId == null) return null;
        return agencyRepository.findByUserId(userId).orElse(null);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyAgency(HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(Map.of(
            "agencyName", agency.getAgencyName(),
            "license", agency.getBusinessLicense(),
            "isApproved", agency.getIsApproved()
        ));
    }

    @GetMapping("/services")
    public ResponseEntity<?> getServices(HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();
        
        List<Map<String, Object>> result = serviceRepository.findByAgencyId(agency.getId()).stream()
            .map(s -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", s.getId());
                map.put("serviceName", s.getServiceName());
                map.put("serviceType", s.getServiceType());
                map.put("originalPrice", s.getOriginalPrice());
                map.put("salePrice", s.getSalePrice());
                map.put("isApproved", s.getIsApproved());
                map.put("imageUrl", s.getImageUrl() != null ? s.getImageUrl() : "https://via.placeholder.com/150");
                map.put("description", s.getDescription());
                map.put("maxPeople", s.getMaxPeople());
                map.put("durationDays", s.getDurationDays());
                map.put("transportation", s.getTransportation());
                map.put("openingTime", s.getOpeningTime());
                map.put("closingTime", s.getClosingTime());
                map.put("availableRooms", s.getAvailableRooms());
                map.put("mapPoints", s.getMapPoints());
                return map;
            }).collect(Collectors.toList());
            
        return ResponseEntity.ok(result);
    }

    @GetMapping("/revenue")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getRevenue(HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        // Tổng doanh thu đơn đã thanh toán
        BigDecimal totalRevenue = commissionRepository.sumRevenueByAgencyId(agency.getId());
        // Tổng hoa hồng đã nộp hthống
        BigDecimal totalCommission = commissionRepository.sumCommissionByAgencyId(agency.getId());
        // Lợi nhuận sau khi trừ hoa hồng
        BigDecimal netRevenue = totalRevenue.subtract(totalCommission);

        // Lịch sử ghi nhận hoa hồng
        List<CommissionRecord> records = commissionRepository.findByAgencyIdOrderByCreatedAtDesc(agency.getId());
        List<Map<String, Object>> history = records.stream().map(r -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("orderId", r.getOrder().getId());
            m.put("orderRevenue", r.getOrderRevenue());
            m.put("commissionAmount", r.getCommissionAmount());
            m.put("status", r.getStatus());
            m.put("createdAt", r.getCreatedAt().toString());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "agencyName", agency.getAgencyName(),
            "totalRevenue", totalRevenue,
            "totalCommission", totalCommission,
            "netRevenue", netRevenue,
            "commissionRate", "5%",
            "history", history
        ));
    }

    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getOrders(HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        List<Order> allOrders = orderRepository.findAll();
        // filter orders where at least one detail belongs to this agency
        List<Map<String, Object>> result = allOrders.stream()
            .filter(o -> o.getOrderDetails().stream().anyMatch(d -> d.getService().getAgency().getId().equals(agency.getId())))
            .map(o -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", o.getId());
                map.put("customerName", o.getUser().getUsername());
                map.put("totalAmount", o.getTotalAmount());
                map.put("status", o.getStatus());
                map.put("orderDate", o.getOrderDate() != null ? o.getOrderDate().toString() : "");
                
                if (!o.getOrderDetails().isEmpty()) {
                    OrderDetail d = o.getOrderDetails().get(0);
                    map.put("serviceName", d.getService().getServiceName());
                    map.put("serviceType", d.getService().getServiceType());
                    map.put("bookingDate", d.getApplyDate() != null ? d.getApplyDate().toString() : "");
                    map.put("bookingTime", d.getBookingTime() != null ? d.getBookingTime().toString() : "");
                    map.put("bookingDays", d.getBookingDays() != null ? d.getBookingDays() : 1);
                    map.put("quantity", d.getQuantity() != null ? d.getQuantity() : 1);
                    
                    // SỬA LẠI ĐOẠN NÀY ĐỂ TÍNH NGÀY KẾT THÚC CHO CẢ TOUR VÀ KHÁCH SẠN
                    String endDate = "";
                    if (d.getApplyDate() != null) {
                        if ("TOUR".equals(d.getService().getServiceType()) && d.getService().getDurationDays() != null) {
                            endDate = d.getApplyDate().plusDays(d.getService().getDurationDays()).toString();
                        } else if ("HOTEL".equals(d.getService().getServiceType()) && d.getBookingDays() != null) {
                            endDate = d.getApplyDate().plusDays(d.getBookingDays()).toString();
                        }
                    }
                    map.put("endDate", endDate);
                }
                return map;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/orders/{id}/approve")
    public ResponseEntity<?> approveOrder(@PathVariable("id") Integer orderId, HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null && "PENDING".equals(order.getStatus())) {
            order.setStatus("AWAITING_PAYMENT");
            orderRepository.save(order);

            // BO: Khong tru phong o day vi da tru luc khach bam Dat (UserController) de giu cho.
            // Chi can set thoi gian tra phong du kien (Optional)
            for (OrderDetail detail : order.getOrderDetails()) {
                if ("HOTEL".equals(detail.getService().getServiceType())) {
                    int days = detail.getBookingDays() != null ? detail.getBookingDays() : 1;
                    detail.setReturnRoomAt(java.time.LocalDateTime.now().plusDays(days));
                }
            }

            // Notify User via Socket & Database DB
            User customer = order.getUser();
            Notification n = Notification.builder()
                .user(customer)
                .message("Đơn hàng #" + order.getId() + " đã được Đại lý duyệt. Vui lòng thanh toán!")
                .type("ORDER_APPROVED")
                .isRead(false)
                .build();
            notificationRepository.save(n);
            messagingTemplate.convertAndSend("/topic/user/notifications/" + customer.getUsername(), "Đơn #" + order.getId() + " đã được Duyệt. Chọn VNPAY ngay!");

            // Send Email logic to User
            emailService.sendEmail(customer.getEmail(), "Thông báo duyệt Đơn Dịch Vụ - SmartTour", "Chúc mừng! Đơn hàng dịch vụ #" + order.getId() + " của bạn đã được Đại lý chấp nhận. Vui lòng đăng nhập ứng dụng và chọn Cổng Thanh toán VNPAY Sandbox để hoàn tất giao dịch.");

            return ResponseEntity.ok(Map.of("message", "Duyệt đơn thành công. Đã gửi Email yêu cầu thanh toán VNPAY."));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Đơn hàng không hợp lệ hoặc đã duyệt."));
    }

    @PostMapping("/orders/{id}/start")
    public ResponseEntity<?> startTrip(@PathVariable("id") Integer orderId, HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null && "PAID".equals(order.getStatus())) {
            order.setStatus("IN_PROGRESS");
            orderRepository.save(order);
            
            // Notify User
            User customer = order.getUser();
            Notification n = Notification.builder()
                .user(customer)
                .message("Đại lý thông báo: Chuyến đi/Dịch vụ theo Đơn #" + order.getId() + " ĐÃ BẮT ĐẦU. Chúc bạn một chuyến đi vui vẻ!")
                .type("ORDER_PROGRESS")
                .isRead(false)
                .build();
            notificationRepository.save(n);
            messagingTemplate.convertAndSend("/topic/user/notifications/" + customer.getUsername(), "Chuyến đi Đơn #" + order.getId() + " bắt đầu!");

            return ResponseEntity.ok(Map.of("message", "Chuyến đi đã bắt đầu!"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Đơn hàng phải ở trạng thái ĐÃ THANH TOÁN (PAID) mới có thể Bắt đầu chuyến đi."));
    }

    @PostMapping("/orders/{id}/complete")
    public ResponseEntity<?> completeTrip(@PathVariable("id") Integer orderId, HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null && "IN_PROGRESS".equals(order.getStatus())) {
            order.setStatus("COMPLETED");
            orderRepository.save(order);

            // Hoàn lại sức chứa (Với Tour là Trả Số Chuyến đi, với Khách sạn là Phòng rảnh)
            for (OrderDetail detail : order.getOrderDetails()) {
                Service svc = detail.getService();
                if ("TOUR".equals(svc.getServiceType())) {
                    int currentTrips = svc.getAvailableTrips() != null ? svc.getAvailableTrips() : 0;
                    svc.setAvailableTrips(currentTrips + 1);
                    serviceRepository.save(svc);
                } else if ("HOTEL".equals(svc.getServiceType()) && !detail.getIsRoomReturned()) {
                    int currentRooms = svc.getAvailableRooms() != null ? svc.getAvailableRooms() : 0;
                    svc.setAvailableRooms(currentRooms + detail.getQuantity());
                    detail.setIsRoomReturned(true);
                    serviceRepository.save(svc);
                }
            }

            // Notify User
            User customer = order.getUser();
            Notification n = Notification.builder()
                .user(customer)
                .message("Đơn hàng #" + order.getId() + " đã HOÀN THÀNH. Cảm ơn bạn đã sử dụng dịch vụ!")
                .type("ORDER_COMPLETED")
                .isRead(false)
                .build();
            notificationRepository.save(n);

            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu hoàn thành & trả lại Slot trống!"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Đơn hàng phải Đang tiến hành mới có thể Hoàn thành."));
    }

    @PostMapping("/orders/{id}/cancel")
    @Transactional
    public ResponseEntity<?> deleteOrder(@PathVariable("id") Integer orderId, HttpServletRequest request) {
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return ResponseEntity.badRequest().body(Map.of("error", "Đơn hàng không tồn tại!"));

        // CẤM tuyệt đối xóa đơn đã thanh toán
        if ("PAID".equals(order.getStatus()) || "IN_PROGRESS".equals(order.getStatus()) || "COMPLETED".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "Đơn hàng đã được thanh toán. Hệ thống không thể hủy — khách hàng vắng mặt cũng không tính hoàn tiền!"));
        }

        if ("PENDING".equals(order.getStatus()) || "AWAITING_PAYMENT".equals(order.getStatus())) {
            User customer = order.getUser();
            String reason = "PENDING".equals(order.getStatus())
                ? "Đại lý từ chối đơn hàng đặt chờ duyệt"
                : "Đại lý hủy do khách chưa thanh toán kịp (trễ/vắng mặt)";

            // Gửi thông báo cho khách trước khi xóa
            Notification notif = Notification.builder()
                .user(customer)
                .message("Đơn hàng #" + order.getId() + " đã bị hủy. Lý do: " + reason)
                .type("ORDER_DELETED")
                .isRead(false)
                .build();
            notificationRepository.save(notif);

            try {
                // ==== HOÀN LẠI PHÒNG/CHUYẾN ĐI KHI HỦY ĐƠN ====
                for (OrderDetail detail : order.getOrderDetails()) {
                    Service svc = detail.getService();
                    if ("HOTEL".equals(svc.getServiceType())) {
                        int current = svc.getAvailableRooms() != null ? svc.getAvailableRooms() : 0;
                        svc.setAvailableRooms(current + detail.getQuantity());
                        serviceRepository.save(svc);
                    } else if ("TOUR".equals(svc.getServiceType())) {
                        int currentTrips = svc.getAvailableTrips() != null ? svc.getAvailableTrips() : 0;
                        svc.setAvailableTrips(currentTrips + 1);
                        serviceRepository.save(svc);
                    }
                }
                
                messagingTemplate.convertAndSend("/topic/user/notifications/" + customer.getUsername(),
                    "Đơn đặt #" + order.getId() + " đã bị đại lý hủy!");
            } catch (Exception ignored) {}

            // Xóa CommissionRecord liên quan trước (tránh FK constraint)
            commissionRepository.deleteByOrderId(orderId);

            // Xóa Order (sẽ cascade xóa luôn OrderDetail do CascadeType.ALL)
            orderRepository.deleteById(orderId);

            return ResponseEntity.ok(Map.of("message", "Đã hủy đơn hàng & hoàn trả lại slot trống thành công!"));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Không thể thực hiện thao tác này!"));
    }

    @PostMapping("/services")
    public ResponseEntity<?> createService(
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestParam("price") BigDecimal price,
            @RequestParam("description") String description,
            @RequestParam(value = "maxPeople", required = false) Integer maxPeople,
            @RequestParam(value = "durationDays", required = false) Integer durationDays,
            @RequestParam(value = "transportation", required = false) String transportation,
            @RequestParam(value = "openingTime", required = false) String openingTime,
            @RequestParam(value = "closingTime", required = false) String closingTime,
            @RequestParam(value = "mapPoints", required = false) String mapPoints,
            @RequestParam(value = "availableRooms", required = false) Integer availableRooms,
            @RequestParam(value = "availableTrips", required = false) Integer availableTrips,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            HttpServletRequest request) {
            
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        try {
            String filename = "https://images.unsplash.com/photo-1542314831-c6a4d27160c9"; // Default image
            if (image != null && !image.isEmpty()) {
                String uploadDir = "uploads/";
                java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }
                String originalName = image.getOriginalFilename();
                String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
                String newFileName = System.currentTimeMillis() + ext;
                java.nio.file.Path filePath = uploadPath.resolve(newFileName);
                java.nio.file.Files.copy(image.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                filename = "/uploads/" + newFileName; // Đường dẫn web
            }

            Service svc = Service.builder()
                    .agency(agency)
                    .serviceName(name)
                    .serviceType(type)
                    .originalPrice(price)
                    .salePrice(price)
                    .description(description)
                    .maxPeople(maxPeople)
                    .durationDays(durationDays)
                    .transportation(transportation)
                    .openingTime(openingTime)
                    .closingTime(closingTime)
                    .mapPoints(mapPoints)
                    .availableRooms(availableRooms)
                    .availableTrips(availableTrips)
                    .imageUrl(filename)
                    .isApproved(false)
                    .isActive(true)
                    .build();

                    
            serviceRepository.save(svc);
            
            // Lưu notification cho Admin vào Database
            List<User> admins = userRepository.findAll().stream().filter(u -> u.getRole() == Role.ADMIN).collect(Collectors.toList());
            for (User admin : admins) {
                Notification n = Notification.builder()
                    .user(admin)
                    .message("Dịch vụ mới: Đại lý " + agency.getAgencyName() + " vừa thêm một dịch vụ/tour chờ duyệt!")
                    .type("NEW_SERVICE")
                    .isRead(false)
                    .build();
                notificationRepository.save(n);
            }

            // Báo notification cho Admin qua WebSocket
            try {
                messagingTemplate.convertAndSend("/topic/admin/notifications", (Object) Map.of(
                    "type", "NEW_SERVICE",
                    "message", "🔔 Dịch vụ mới: Đại lý " + agency.getAgencyName() + " vừa thêm một dịch vụ/tour chờ duyệt!"
                ));
            } catch (Exception e) {}

            return ResponseEntity.ok(Map.of("status", "success", "message", "Đã tải lên kèm ảnh! Chờ duyệt."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(e.getMessage() != null ? e.getMessage() : e.toString());
        }
    }

    @PostMapping("/services/{id}/update")
    public ResponseEntity<?> updateService(
            @PathVariable("id") Integer id,
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestParam("price") BigDecimal price,
            @RequestParam("description") String description,
            @RequestParam(value = "maxPeople", required = false) Integer maxPeople,
            @RequestParam(value = "durationDays", required = false) Integer durationDays,
            @RequestParam(value = "transportation", required = false) String transportation,
            @RequestParam(value = "openingTime", required = false) String openingTime,
            @RequestParam(value = "closingTime", required = false) String closingTime,
            @RequestParam(value = "mapPoints", required = false) String mapPoints,
            @RequestParam(value = "availableRooms", required = false) Integer availableRooms,
            @RequestParam(value = "availableTrips", required = false) Integer availableTrips,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            HttpServletRequest request) {
            
        Agency agency = getAgencyFromSession(request);
        if (agency == null) return ResponseEntity.status(403).build();

        try {
            Service svc = serviceRepository.findById(id).orElse(null);
            if (svc == null || !svc.getAgency().getId().equals(agency.getId())) {
                return ResponseEntity.badRequest().body("Dịch vụ không tồn tại hoặc không có quyền!");
            }

            svc.setServiceName(name);
            svc.setServiceType(type);
            svc.setOriginalPrice(price);
            svc.setSalePrice(price);
            svc.setDescription(description);
            svc.setMaxPeople(maxPeople);
            svc.setAvailableTrips(availableTrips);
            svc.setDurationDays(durationDays);
            svc.setTransportation(transportation);
            svc.setOpeningTime(openingTime);
            svc.setClosingTime(closingTime);
            svc.setMapPoints(mapPoints);
            svc.setAvailableRooms(availableRooms); // Fix: Cập nhật số lượng phòng

            if (image != null && !image.isEmpty()) {
                String uploadDir = "uploads/";
                java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }
                String originalName = image.getOriginalFilename();
                String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
                String newFileName = System.currentTimeMillis() + ext;
                java.nio.file.Path filePath = uploadPath.resolve(newFileName);
                java.nio.file.Files.copy(image.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                svc.setImageUrl("/uploads/" + newFileName);
            }

            // Quan trọng: Khi sửa thì trạng thái quay về Chưa được duyệt
            svc.setIsApproved(false);
            serviceRepository.save(svc);

            // Lưu notification cho Admin vào Database
            List<User> admins = userRepository.findAll().stream().filter(u -> u.getRole() == Role.ADMIN).collect(Collectors.toList());
            for (User admin : admins) {
                Notification n = Notification.builder()
                    .user(admin)
                    .message("Yêu cầu duyệt lại: Đại lý " + agency.getAgencyName() + " vừa cập nhật dịch vụ " + svc.getServiceName())
                    .type("UPDATE_SERVICE")
                    .isRead(false)
                    .build();
                notificationRepository.save(n);
            }

            // Báo notification cho Admin duyệt lại qua WebSocket
            try {
                messagingTemplate.convertAndSend("/topic/admin/notifications", (Object) Map.of(
                    "type", "UPDATE_SERVICE",
                    "message", "✏️ Yêu cầu duyệt lại: Đại lý " + agency.getAgencyName() + " vừa cập nhật dịch vụ " + svc.getServiceName()
                ));
            } catch (Exception e) {}

            return ResponseEntity.ok(Map.of("status", "success", "message", "Đã cập nhật dịch vụ! Vui lòng chờ Admin duyệt lại."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(e.getMessage() != null ? e.getMessage() : e.toString());
        }
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile image) {
        try {
            if (image != null && !image.isEmpty()) {
                String uploadDir = "uploads/";
                java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
                if (!java.nio.file.Files.exists(uploadPath)) { java.nio.file.Files.createDirectories(uploadPath); }
                String originalName = image.getOriginalFilename();
                String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
                String newFileName = "point_" + System.currentTimeMillis() + ext;
                java.nio.file.Path filePath = uploadPath.resolve(newFileName);
                java.nio.file.Files.copy(image.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                return ResponseEntity.ok(Map.of("url", "/uploads/" + newFileName));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Không có file upload"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }


    @PostMapping("/locations")
    public ResponseEntity<?> createLocation(
            @RequestParam("name") String name,
            @RequestParam("coordinates") String coordinates,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image) {
            
        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            try {
                String uploadDir = "uploads/";
                java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }
                String originalName = image.getOriginalFilename();
                String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
                String newFileName = "loc_" + System.currentTimeMillis() + ext;
                java.nio.file.Path filePath = uploadPath.resolve(newFileName);
                java.nio.file.Files.copy(image.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                imageUrl = "/uploads/" + newFileName;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        double lat = 11.940;
        double lng = 108.450;
        try {
            if (coordinates != null && coordinates.contains(",")) {
                String[] parts = coordinates.split(",");
                lat = Double.parseDouble(parts[0].trim());
                lng = Double.parseDouble(parts[1].trim());
            }
        } catch (Exception e) {}

        Location loc = Location.builder()
                .name(name)
                .category("KHAC")
                .latitude(lat)
                .longitude(lng)
                .description("Cập nhật bởi Đại lý")
                .imageUrl(imageUrl)
                .build();
                
        locationRepository.save(loc);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleAllExceptions(Exception ex) {
        ex.printStackTrace();
        return ResponseEntity.status(500).body(Map.of(
            "error", "Chi tiết lỗi DB: " + ex.getClass().getSimpleName() + " - " + ex.getMessage()
        ));
    }

    @GetMapping("/chart-data")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getStaffChartData(HttpServletRequest request) {
        User user = getUserFromSession(request);
        if (user == null) return ResponseEntity.status(401).build();

        Agency agency = agencyRepository.findByUserId(user.getId()).orElse(null);
        if (agency == null) return ResponseEntity.badRequest().build();

        // Lọc ra các đơn hàng thuộc về Đại lý này
        List<Order> agencyOrders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderDetails() != null && !o.getOrderDetails().isEmpty() &&
                             o.getOrderDetails().get(0).getService().getAgency().getId().equals(agency.getId()))
                .toList();

        BigDecimal[] monthlyRevenue = new BigDecimal[12];
        java.util.Arrays.fill(monthlyRevenue, BigDecimal.ZERO);
        int currentYear = LocalDate.now().getYear();

        for (Order o : agencyOrders) {
            if ("PAID".equals(o.getStatus()) || "IN_PROGRESS".equals(o.getStatus()) || "COMPLETED".equals(o.getStatus())) {
                if (o.getOrderDate() != null && o.getOrderDate().getYear() == currentYear) {
                    int monthIndex = o.getOrderDate().getMonthValue() - 1;
                    monthlyRevenue[monthIndex] = monthlyRevenue[monthIndex].add(o.getTotalAmount());
                }
            }
        }
        return ResponseEntity.ok(Map.of("monthlyRevenue", monthlyRevenue));
    }

    @GetMapping("/search-agencies")
    @Transactional(readOnly = true)
    public ResponseEntity<?> searchAgencies(
            @RequestParam(value = "keyword", required = false, defaultValue = "") String keyword,
            HttpServletRequest request) {
        
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("USER_ROLE") == null) {
            return ResponseEntity.status(401).build();
        }

        List<Agency> agencies = agencyRepository.searchAgenciesByKeyword(keyword);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Agency a : agencies) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", a.getId());
            map.put("agencyName", a.getAgencyName());
            map.put("taxCode", a.getTaxCode());
            map.put("contactPhone", a.getContactPhone());
            map.put("address", a.getAddress());

            List<Service> services = serviceRepository.findByAgencyId(a.getId());
            List<Map<String, Object>> serviceList = new ArrayList<>();
            for (Service s : services) {
                Map<String, Object> sMap = new HashMap<>();
                sMap.put("id", s.getId());
                sMap.put("serviceName", s.getServiceName());
                sMap.put("serviceType", s.getServiceType());
                serviceList.add(sMap);
            }
            map.put("services", serviceList);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }
}
