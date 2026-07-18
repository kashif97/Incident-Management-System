package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.sla.IncidentSla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentSlaRepository extends JpaRepository<IncidentSla, Long> {
    Optional<IncidentSla> findByIncidentId(Long incidentId);
    List<IncidentSla> findByResolutionBreachedFalseAndResolutionDueAtBefore(LocalDateTime now);
    List<IncidentSla> findByResponseBreachedFalseAndResponseDueAtBeforeAndFirstResponseAtIsNull(LocalDateTime now);
    List<IncidentSla> findAllByOrderByResolutionDueAtAsc();
}
