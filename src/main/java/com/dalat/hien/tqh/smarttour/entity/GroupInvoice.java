package com.dalat.hien.tqh.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "group_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itinerary_id", unique = true, nullable = false)
    private Itinerary itinerary;

    @Column(name = "total_incurred_cost")
    private BigDecimal totalIncurredCost;

    @Column(name = "member_count", nullable = false)
    private Integer memberCount;

    @Column(name = "split_details", columnDefinition = "JSON")
    private String splitDetails; 
}
