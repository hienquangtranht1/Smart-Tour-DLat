package com.dalat.nhom6.chieuthu5.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @Column(name = "service_name", nullable = false, length = 200)
    private String serviceName;

    @Column(name = "service_type", nullable = false, length = 50)
    private String serviceType; // TOUR, HOTEL

    @Column(name = "original_price", nullable = false)
    private BigDecimal originalPrice;

    @Column(name = "sale_price", nullable = false)
    private BigDecimal salePrice;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "map_points", columnDefinition = "TEXT")
    private String mapPoints;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_approved")
    private Boolean isApproved;

    @Column(name = "is_active")
    private Boolean isActive;

    // ----- Tour Specific -----
    @Column(name = "tour_schedule", columnDefinition = "TEXT")
    private String tourSchedule;

    @Column(name = "max_people")
    private Integer maxPeople;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "available_trips")
    private Integer availableTrips; // Số chuyến đi tối đa phục vụ cùng lúc

    @Column(name = "transportation")
    private String transportation;

    @Column(name = "opening_time", length = 20)
    private String openingTime;

    @Column(name = "closing_time", length = 20)
    private String closingTime;

    @Column(name = "departure_point")
    private String departurePoint;


    // ----- Hotel Specific -----
    @Column(name = "hotel_name", length = 200)
    private String hotelName;

    @Column(name = "room_type", length = 100)
    private String roomType;

    @Column(name = "available_rooms")
    private Integer availableRooms;

    private Integer capacity;

    @Column(columnDefinition = "TEXT")
    private String amenities;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isApproved == null) this.isApproved = false;
        if (this.isActive == null) this.isActive = true;
    }
}
