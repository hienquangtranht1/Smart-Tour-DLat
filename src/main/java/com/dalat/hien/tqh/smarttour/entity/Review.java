package com.dalat.hien.tqh.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    // 1 to 5 stars, null if it's a report
    @Column(name = "rating")
    private Integer rating;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // REVIEW hoặc REPORT
    @Column(length = 20, nullable = false)
    private String type;

    // PENDING, APPROVED, REJECTED
    @Column(length = 20, nullable = false)
    private String status;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
        if (this.isDeleted == null) this.isDeleted = false;
    }
}
