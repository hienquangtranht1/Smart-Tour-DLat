package com.dalat.hien.tqh.smarttour.repository;

import com.dalat.hien.tqh.smarttour.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserId(Integer userId);
    List<Order> findByStatus(String status);

    // Dùng FETCH JOIN để tránh N+1 query lazy-load OrderDetails gây lag
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderDetails od LEFT JOIN FETCH od.service WHERE o.user.id = :userId ORDER BY o.id DESC")
    List<Order> findByUserIdWithDetails(@Param("userId") Integer userId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Integer userId);
}
