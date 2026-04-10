package com.dalat.hien.tqh.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role;

    @Column(name = "is_locked")
    private Boolean isLocked;

    @Column(name = "is_email_verified")
    private Boolean isEmailVerified;

    // Lưu Google account sub ID để nhận diện tài khoản Google
    @Column(name = "google_id", length = 100, unique = true)
    private String googleId;

    // Trạng thái kích hoạt tài khoản (Admin có thể bật/tắt)
    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Ánh xạ 1-1 với cơ sở Đại lý nếu có
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Agency agency;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isLocked == null) this.isLocked = false;
        if (this.role == null) this.role = Role.USER;
        if (this.isEmailVerified == null) this.isEmailVerified = false;
        if (this.isActive == null) this.isActive = true;
        if (this.isDeleted == null) this.isDeleted = false;
    }
}
