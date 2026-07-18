package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.incident.IncidentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentCommentRepository extends JpaRepository<IncidentComment, Long> {
    List<IncidentComment> findByIncidentIdOrderByCommentedAtAsc(Long id);
    List<IncidentComment> findByIncidentIdAndIsInternalFalseOrderByCommentedAtAsc(Long id);
}
