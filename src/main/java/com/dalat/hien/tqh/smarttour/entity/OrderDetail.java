package com.dalat.hien.tqh.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "order_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    private Integer quantity;

    @Column(name = "actual_price", nullable = false)
    private BigDecimal actualPrice;

    @Column(name = "booking_days")
    private Integer bookingDays;

    @Column(name = "return_room_at")
    private java.time.LocalDateTime returnRoomAt;

    @Column(name = "is_room_returned")
    private Boolean isRoomReturned;

    @Column(name = "apply_date")
    private LocalDate applyDate;

    @Column(name = "booking_time")
    private LocalTime bookingTime;
}
