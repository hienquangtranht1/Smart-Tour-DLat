package com.dalat.hien.tqh.smarttour.repository;

import com.dalat.hien.tqh.smarttour.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findByServiceIdAndStatusOrderByCreatedAtDesc(Integer serviceId, String status);
    List<Review> findByStatusOrderByCreatedAtDesc(String status);
}
