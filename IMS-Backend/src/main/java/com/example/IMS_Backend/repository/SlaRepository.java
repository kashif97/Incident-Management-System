package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.incident.IncidentPriority;
import com.example.IMS_Backend.sla.Sla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlaRepository extends JpaRepository<Sla, Long> {
    Optional<Sla> findByPriorityAndIsActiveTrue(IncidentPriority priority);
    List<Sla> findByIsActiveTrue();
}
