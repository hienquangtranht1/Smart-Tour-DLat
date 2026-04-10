package com.dalat.hien.tqh.smarttour.controller;

import com.dalat.hien.tqh.smarttour.entity.Notification;
import com.dalat.hien.tqh.smarttour.entity.User;
import com.dalat.hien.tqh.smarttour.repository.NotificationRepository;
import com.dalat.hien.tqh.smarttour.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("USER_ID");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "User not found"));

        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(user.getId());
        
        // Convert to DTO to avoid lazy loading issues
        List<Map<String, Object>> notifDTOs = unread.stream().map(n -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", n.getId());
            map.put("message", n.getMessage());
            map.put("type", n.getType() != null ? n.getType() : "INFO");
            map.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
            // Thêm link target để frontend điều hướng đúng tab
            String linkTarget = "billing"; // mặc định
            if (n.getType() != null) {
                if (n.getType().equals("ORDER_APPROVED") || n.getType().equals("VNPAY_SUCCESS")) {
                    linkTarget = "billing"; // sang tab Hóa đơn
                } else if (n.getType().equals("NEW_BOOKING")) {
                    linkTarget = "orders"; // sang tab Đơn hàng (Staff)
                } else if (n.getType().equals("NEW_SERVICE") || n.getType().equals("UPDATE_SERVICE")) {
                    linkTarget = "services"; // sang tab Dịch vụ (Admin)
                } else if (n.getType().equals("NEW_AGENCY")) {
                    linkTarget = "agencies"; // sang tab Đại lý (Admin)
                }
            }
            map.put("linkTarget", linkTarget);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "unreadCount", unread.size(),
            "notifications", notifDTOs
        ));
    }

    @PostMapping("/mark-read/{id}")
    public ResponseEntity<?> markOneAsRead(@PathVariable Integer id, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("USER_ID");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "User not found"));

        Notification n = notificationRepository.findById(id).orElse(null);
        if (n != null && n.getUser().getId().equals(user.getId())) {
            n.setIsRead(true);
            notificationRepository.save(n);
        }
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markAllAsRead(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("USER_ID");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "User not found"));

        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(user.getId());
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);

        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu xem toàn bộ thông báo."));
    }
}
