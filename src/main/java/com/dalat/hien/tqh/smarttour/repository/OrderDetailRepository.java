package com.dalat.hien.tqh.smarttour.repository;

import com.dalat.hien.tqh.smarttour.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {
    List<OrderDetail> findByServiceId(Integer serviceId);

    // Lấy các phòng khách sạn đã quá giờ trả phòng nhưng mảng "isRoomReturned" chưa được mark true
    @Query("SELECT od FROM OrderDetail od JOIN od.order o WHERE od.returnRoomAt < :now AND (od.isRoomReturned = false OR od.isRoomReturned IS NULL) AND o.status IN ('AWAITING_PAYMENT', 'PAID')")
    List<OrderDetail> findExpiredHotelBookings(@Param("now") LocalDateTime now);

    // Cần @Modifying + @Transactional + @Query để Spring Data JPA thực sự
    // thực thi câu lệnh DELETE. Nếu thiếu, query sẽ bị bỏ qua hoàn toàn!
    @Modifying
    @Transactional
    @Query("DELETE FROM OrderDetail od WHERE od.service.id = :serviceId")
    void deleteByServiceId(@Param("serviceId") Integer serviceId);
}
