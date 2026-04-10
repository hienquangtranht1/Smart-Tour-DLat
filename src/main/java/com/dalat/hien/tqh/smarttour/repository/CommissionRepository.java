package com.dalat.hien.tqh.smarttour.repository;

import com.dalat.hien.tqh.smarttour.entity.CommissionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

public interface CommissionRepository extends JpaRepository<CommissionRecord, Integer> {

    List<CommissionRecord> findByAgencyIdOrderByCreatedAtDesc(Integer agencyId);

    @Query("SELECT COALESCE(SUM(c.commissionAmount), 0) FROM CommissionRecord c WHERE c.agency.id = :agencyId")
    BigDecimal sumCommissionByAgencyId(@Param("agencyId") Integer agencyId);

    @Query("SELECT COALESCE(SUM(c.commissionAmount), 0) FROM CommissionRecord c")
    BigDecimal sumTotalCommission();

    @Query("SELECT COALESCE(SUM(c.orderRevenue), 0) FROM CommissionRecord c WHERE c.agency.id = :agencyId")
    BigDecimal sumRevenueByAgencyId(@Param("agencyId") Integer agencyId);

    // Xóa bản ghi hoa hồng theo Order (dùng khi hủy đơn hàng)
    @Modifying
    @Transactional
    @Query("DELETE FROM CommissionRecord c WHERE c.order.id = :orderId")
    void deleteByOrderId(@Param("orderId") Integer orderId);
}
