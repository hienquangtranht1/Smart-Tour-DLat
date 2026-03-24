package com.dalat.nhom6.chieuthu5.smarttour.controller;

import com.dalat.nhom6.chieuthu5.smarttour.entity.Agency;
import com.dalat.nhom6.chieuthu5.smarttour.entity.Role;
import com.dalat.nhom6.chieuthu5.smarttour.entity.User;
import com.dalat.nhom6.chieuthu5.smarttour.repository.AgencyRepository;
import com.dalat.nhom6.chieuthu5.smarttour.repository.UserRepository;
import com.dalat.nhom6.chieuthu5.smarttour.service.EmailService;
import com.dalat.nhom6.chieuthu5.smarttour.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private AgencyRepository agencyRepository;
    @Autowired private OtpService otpService;
    @Autowired private EmailService emailService;
    @Autowired private com.dalat.nhom6.chieuthu5.smarttour.repository.NotificationRepository notificationRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ── 1. ĐĂNG NHẬP ─────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam("username") String username,
                                   @RequestParam("password") String password,
                                   HttpServletRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(username.trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("status","error","message","Sai tài khoản hoặc mật khẩu!"));
        }
        User user = userOpt.get();

        String dbPass = user.getPassword();
        boolean passOk = false;

        // So sánh BCrypt, an toàn với null
        if (dbPass != null) {
            try {
                passOk = passwordEncoder.matches(password, dbPass);
            } catch (Exception ignored) {}
            
            if (!passOk && dbPass.equals(password)) {
                passOk = true;
            }
        }

        if (!passOk) {
            return ResponseEntity.status(401).body(Map.of("status","error","message","Sai tài khoản hoặc mật khẩu!"));
        }

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            return ResponseEntity.status(403).body(Map.of("status","error","message","Tài khoản đã bị khóa!"));
        }

        Role userRoleEnum = user.getRole();
        if (userRoleEnum == null) {
            userRoleEnum = Role.USER;
        }
        String roleStr = userRoleEnum.name();

        // Nếu STAFF, kiểm tra đại lý đã được duyệt chưa
        if (userRoleEnum == Role.STAFF) {
            Optional<Agency> agencyOpt = agencyRepository.findByUserId(user.getId());
            if (agencyOpt.isEmpty() || !Boolean.TRUE.equals(agencyOpt.get().getIsApproved())) {
                return ResponseEntity.status(403).body(Map.of("status","error","message","Tài khoản Đại lý của bạn đang chờ Admin phê duyệt!"));
            }
        }

        HttpSession session = request.getSession(true);
        session.setAttribute("USER_ID", user.getId());
        session.setAttribute("USER_ROLE", roleStr);

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "role", roleStr,
            "redirect", "/" + roleStr.toLowerCase() + ".html"
        ));
    }

    // ── 2. GỬI OTP VỀ GMAIL ─────────────────────────────────
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam("email") String email) {
        email = email.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("status","error","message","Email này đã được đăng ký!"));
        }
        try {
            String otp = otpService.generateAndStore(email);
            emailService.sendOtpEmail(email, otp);
            return ResponseEntity.ok(Map.of("status","ok","message","Đã gửi mã OTP đến email " + email + ". Vui lòng kiểm tra hộp thư!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status","error","message","Gửi email thất bại: " + e.getMessage()));
        }
    }

    // ── 3. XÁC THỰC OTP ─────────────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam("email") String email, @RequestParam("otp") String otp) {
        boolean valid = otpService.verify(email.trim().toLowerCase(), otp.trim());
        if (valid) return ResponseEntity.ok(Map.of("status","ok","message","OTP hợp lệ!"));
        return ResponseEntity.badRequest().body(Map.of("status","error","message","Mã OTP không đúng hoặc đã hết hạn!"));
    }

    // ── 4. ĐĂNG KÝ ──────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam("email") String email,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam("otp") String otp,
            @RequestParam(value = "role", defaultValue = "USER") String role,
            // Trường dành riêng cho Staff/Đại lý
            @RequestParam(value = "agencyName", required = false) String agencyName,
            @RequestParam(value = "businessLicense", required = false) String businessLicense,
            @RequestParam(value = "taxCode", required = false) String taxCode,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "contactPhone", required = false) String contactPhone,
            @RequestParam(value = "website", required = false) String website) {

        // Kiểm tra OTP
        if (!otpService.verify(email.trim().toLowerCase(), otp.trim())) {
            return ResponseEntity.badRequest().body(Map.of("status","error","message","Mã OTP không đúng hoặc đã hết hạn!"));
        }

        if (userRepository.existsByUsername(username.trim())) {
            return ResponseEntity.badRequest().body(Map.of("status","error","message","Tên đăng nhập đã tồn tại!"));
        }
        if (userRepository.existsByEmail(email.trim())) {
            return ResponseEntity.badRequest().body(Map.of("status","error","message","Email đã được đăng ký!"));
        }

        Role userRole;
        try { userRole = Role.valueOf(role.toUpperCase()); }
        catch (Exception e) { userRole = Role.USER; }

        User newUser = User.builder()
                .username(username.trim())
                .password(passwordEncoder.encode(password))
                .email(email.trim().toLowerCase())
                .fullName(fullName)
                .phone(phone)
                .role(userRole)
                .isEmailVerified(true) // Đã xác thực qua OTP
                .build();

        newUser = userRepository.save(newUser);

        // Nếu đăng ký làm Đại lý thì tạo thêm bản ghi Agency
        if (userRole == Role.STAFF) {
            Agency agency = Agency.builder()
                    .user(newUser)
                    .agencyName(agencyName != null ? agencyName : username + " Agency")
                    .businessLicense(businessLicense)
                    .taxCode(taxCode)
                    .address(address)
                    .contactPhone(contactPhone != null ? contactPhone : phone)
                    .website(website)
                    .isApproved(false) // Chờ Admin duyệt
                    .build();
            agencyRepository.save(agency);
            
            // Gửi thông báo WebSocket cho admin
            try {
                messagingTemplate.convertAndSend("/topic/admin/notifications", (Object) Map.of(
                    "type", "NEW_AGENCY",
                    "message", "🔔 Đại lý mới: " + agency.getAgencyName() + " vừa đăng ký chờ duyệt!"
                ));
            } catch (Exception e) {
                System.err.println("Lỗi gửi chuông báo: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of("status","ok","message","Đăng ký Đại lý thành công! Vui lòng chờ Admin phê duyệt tài khoản trước khi đăng nhập."));
        }

        return ResponseEntity.ok(Map.of("status","ok","message","Đăng ký thành công! Bạn có thể đăng nhập ngay."));
    }

    // ── 5. XEM & CẬP NHẬT HỒ SƠ ────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        Integer userId = getUserIdFromSession(request);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","Chưa đăng nhập!"));

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error","Không tìm thấy tài khoản!"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("email", user.getEmail());
        result.put("fullName", user.getFullName());
        result.put("phone", user.getPhone());
        result.put("avatarUrl", user.getAvatarUrl());
        result.put("role", user.getRole().name());
        result.put("isEmailVerified", user.getIsEmailVerified());
        result.put("createdAt", user.getCreatedAt());

        // Thêm thông tin Agency nếu là Staff
        if (user.getRole() == Role.STAFF) {
            agencyRepository.findByUserId(userId).ifPresent(a -> {
                Map<String, Object> agInfo = new LinkedHashMap<>();
                agInfo.put("id", a.getId());
                agInfo.put("agencyName", a.getAgencyName());
                agInfo.put("businessLicense", a.getBusinessLicense());
                agInfo.put("taxCode", a.getTaxCode());
                agInfo.put("address", a.getAddress());
                agInfo.put("contactPhone", a.getContactPhone());
                agInfo.put("website", a.getWebsite());
                agInfo.put("description", a.getDescription());
                agInfo.put("logoUrl", a.getLogoUrl());
                agInfo.put("isApproved", a.getIsApproved());
                result.put("agency", agInfo);
            });
        }

        return ResponseEntity.ok(result);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "avatarUrl", required = false) String avatarUrl,
            @RequestParam(value = "agencyName", required = false) String agencyName,
            @RequestParam(value = "taxCode", required = false) String taxCode,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "contactPhone", required = false) String contactPhone,
            @RequestParam(value = "website", required = false) String website,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "logoUrl", required = false) String logoUrl,
            HttpServletRequest request) {

        Integer userId = getUserIdFromSession(request);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","Chưa đăng nhập!"));

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error","Không tìm thấy tài khoản!"));

        if (fullName != null) user.setFullName(fullName);
        if (phone != null) user.setPhone(phone);
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        // Cập nhật thông tin Agency nếu là Staff
        if (user.getRole() == Role.STAFF) {
            agencyRepository.findByUserId(userId).ifPresent(a -> {
                if (agencyName != null) a.setAgencyName(agencyName);
                if (taxCode != null) a.setTaxCode(taxCode);
                if (address != null) a.setAddress(address);
                if (contactPhone != null) a.setContactPhone(contactPhone);
                if (website != null) a.setWebsite(website);
                if (description != null) a.setDescription(description);
                if (logoUrl != null) a.setLogoUrl(logoUrl);
                agencyRepository.save(a);
            });
        }

        return ResponseEntity.ok(Map.of("status","ok","message","Cập nhật hồ sơ thành công!"));
    }

    // ── 6. ĐỔI MẬT KHẨU ────────────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestParam("oldPassword") String oldPassword,
            @RequestParam("newPassword") String newPassword,
            HttpServletRequest request) {

        Integer userId = getUserIdFromSession(request);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","Chưa đăng nhập!"));

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error","Không tìm thấy tài khoản!"));

        boolean oldPassOk = passwordEncoder.matches(oldPassword, user.getPassword());
        if (!oldPassOk && !user.getPassword().equals(oldPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error","Mật khẩu cũ không đúng!"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status","ok","message","Đổi mật khẩu thành công!"));
    }

    // ── 7. ĐĂNG XUẤT ────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.ok(Map.of("status","ok","message","Đăng xuất thành công!"));
    }

    // ── HELPER ────────────────────────────────────────────────
    private Integer getUserIdFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Object attr = session.getAttribute("USER_ID");
        if (attr instanceof Integer i) return i;
        if (attr instanceof String s) { try { return Integer.parseInt(s); } catch (Exception ignored) {} }
        return null;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of(
            "status", "error",
            "message", "Lỗi Server: " + e.getClass().getSimpleName() + " - " + e.getMessage()
        ));
    }
}

