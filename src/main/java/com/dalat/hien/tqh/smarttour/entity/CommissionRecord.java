package com.dalat.hien.tqh.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Ghi nhận hoa hồng 5% nộp từ Đại Lý (Staff/Agency) vào Admin hệ thống
 * khi một đơn hàng được thanh toán thành công qua VNPAY
 */
@Entity
@Table(name = "commission_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Đơn hàng phát sinh hoa hồng
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Đại lý nộp hoa hồng
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    // Doanh thu của đơn hàng (totalAmount)
    @Column(name = "order_revenue", nullable = false)
    private BigDecimal orderRevenue;

    // Tỷ lệ hoa hồng (mặc định 5%)
    @Column(name = "commission_rate", nullable = false)
    private BigDecimal commissionRate;

    // Số tiền hoa hồng thực tế = orderRevenue * commissionRate
    @Column(name = "commission_amount", nullable = false)
    private BigDecimal commissionAmount;

    // Trạng thái: PENDING (chờ nộp), PAID (đã quyết toán)
    @Column(length = 30)
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PAID"; // tự động ghi nhận là đã nộp
        if (this.commissionRate == null) this.commissionRate = new BigDecimal("0.05");
    }
}
