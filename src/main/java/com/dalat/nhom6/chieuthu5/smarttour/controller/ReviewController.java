package com.dalat.nhom6.chieuthu5.smarttour.controller;

import com.dalat.nhom6.chieuthu5.smarttour.entity.Review;

import com.dalat.nhom6.chieuthu5.smarttour.entity.Service;
import com.dalat.nhom6.chieuthu5.smarttour.entity.User;
import com.dalat.nhom6.chieuthu5.smarttour.repository.ReviewRepository;
import com.dalat.nhom6.chieuthu5.smarttour.repository.ServiceRepository;
import com.dalat.nhom6.chieuthu5.smarttour.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    // Helper to get UserId
    private Integer getUserIdFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Object attr = session.getAttribute("USER_ID");
        if (attr instanceof Integer) return (Integer) attr;
        if (attr != null) {
            try { return Integer.parseInt(attr.toString()); } catch (Exception ignored) {}
        }
        return null;
    }

    private String getUserRoleFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Object attr = session.getAttribute("USER_ROLE");
        return attr != null ? attr.toString() : null;
    }

    // 1. GỬI ĐÁNH GIÁ HOẶC BÁO CÁO (User)
    @PostMapping
    public ResponseEntity<?> submitReview(
            @RequestParam("serviceId") Integer serviceId,
            @RequestParam(value = "rating", required = false) Integer rating,
            @RequestParam("content") String content,
            @RequestParam("type") String type, // REVIEW hoặc REPORT
            HttpServletRequest request) {

        Integer userId = getUserIdFromSession(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Vui lòng đăng nhập để gửi đánh giá/báo cáo."));
        }

        User user = userRepository.findById(userId).orElse(null);
        Service service = serviceRepository.findById(serviceId).orElse(null);

        if (user == null || service == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Người dùng hoặc dịch vụ không tồn tại."));
        }

        Review review = Review.builder()
                .user(user)
                .service(service)
                .rating("REVIEW".equalsIgnoreCase(type) ? rating : null)
                .content(content)
                .type(type.toUpperCase())
                .status("PENDING")
                .build();

        reviewRepository.save(review);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Đã gửi thành công, đang chờ Admin duyệt!"));
    }

    // 2. LẤY DANH SÁCH ĐÁNH GIÁ ĐÃ DUYỆT CỦA MỘT DỊCH VỤ (Public)
    @GetMapping("/service/{serviceId}")
    public ResponseEntity<?> getApprovedReviews(@PathVariable("serviceId") Integer serviceId) {
        List<Review> reviews = reviewRepository.findByServiceIdAndStatusOrderByCreatedAtDesc(serviceId, "APPROVED");
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Review r : reviews) {
            if (Boolean.TRUE.equals(r.getIsDeleted())) continue;
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("rating", r.getRating());
            map.put("content", r.getContent());
            map.put("type", r.getType());
            map.put("createdAt", r.getCreatedAt().toString());
            map.put("userName", r.getUser().getFullName() != null ? r.getUser().getFullName() : r.getUser().getUsername());
            map.put("userAvatar", r.getUser().getAvatarUrl());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // 3. ADMIN LẤY DANH SÁCH ĐÁNH GIÁ/BÁO CÁO CHỜ DUYỆT HOẶC TẤT CẢ PENDING (Admin)
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingReviews(HttpServletRequest request) {
        String role = getUserRoleFromSession(request);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }

        List<Review> reviews = reviewRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Review r : reviews) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("rating", r.getRating());
            map.put("content", r.getContent());
            map.put("type", r.getType());
            map.put("status", r.getStatus());
            map.put("isDeleted", r.getIsDeleted() != null ? r.getIsDeleted() : false);
            map.put("createdAt", r.getCreatedAt().toString());
            map.put("userName", r.getUser().getFullName() != null ? r.getUser().getFullName() : r.getUser().getUsername());
            map.put("serviceName", r.getService().getServiceName());
            map.put("agencyName", r.getService().getAgency().getAgencyName());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // 4. ADMIN DUYỆT / TỪ CHỐI (Admin)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReviewStatus(
            @PathVariable("id") Integer id,
            @RequestParam("status") String status,
            HttpServletRequest request) {

        String role = getUserRoleFromSession(request);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền thực hiện!"));
        }

        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy đánh giá/báo cáo!"));
        }

        review.setStatus(status.toUpperCase());
        reviewRepository.save(review);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Đã cập nhật trạng thái " + status));
    }

    // 5. ADMIN XÓA (Admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable("id") Integer id, HttpServletRequest request) {
        String role = getUserRoleFromSession(request);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền thực hiện!"));
        }

        Review review = reviewRepository.findById(id).orElse(null);
        if (review != null) {
            review.setIsDeleted(true);
            reviewRepository.save(review);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Đã xóa đánh giá/báo cáo."));
        }
        return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy đánh giá/báo cáo."));
    }
}
