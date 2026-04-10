package com.dalat.hien.tqh.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "itinerary_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItineraryDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itinerary_id", nullable = false)
    private Itinerary itinerary;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    // MORNING, AFTERNOON, EVENING
    @Column(name = "session_of_day", nullable = false, length = 20)
    private String sessionOfDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "distance_osm")
    private Double distanceOsm;

    @Column(name = "travel_time")
    private Double travelTime;
}
