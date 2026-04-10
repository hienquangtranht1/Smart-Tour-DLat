package com.dalat.hien.tqh.smarttour.repository;

import com.dalat.hien.tqh.smarttour.entity.Agency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, Integer> {
    Optional<Agency> findByUserId(Integer userId);
    boolean existsByBusinessLicense(String license);

    @Query("SELECT DISTINCT a FROM Agency a LEFT JOIN Service s ON s.agency = a WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(a.agencyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.taxCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.contactPhone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Agency> searchAgenciesByKeyword(@Param("keyword") String keyword);
}
