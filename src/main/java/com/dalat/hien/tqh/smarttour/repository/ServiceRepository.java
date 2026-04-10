package com.dalat.hien.tqh.smarttour.repository;

import com.dalat.hien.tqh.smarttour.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Integer> {
    List<Service> findByIsApprovedTrueAndIsActiveTrue();
    List<Service> findByAgencyId(Integer agencyId);
    List<Service> findByServiceType(String serviceType);
}
