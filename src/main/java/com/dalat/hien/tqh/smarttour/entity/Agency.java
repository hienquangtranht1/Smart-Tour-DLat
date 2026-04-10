package com.dalat.hien.tqh.smarttour.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết 1-1 với tài khoản User (Role = STAFF)
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name = "agency_name", nullable = false, length = 200)
    private String agencyName;

    // Mã số kinh doanh / Số đăng ký kinh doanh
    @Column(name = "business_license", length = 100)
    private String businessLicense;

    // Mã số thuế
    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(length = 255)
    private String address;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(length = 255)
    private String website;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "is_approved")
    private Boolean isApproved;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @PrePersist
    protected void onCreate() {
        if (this.isApproved == null) this.isApproved = false;
        if (this.isDeleted == null) this.isDeleted = false;
    }
}
