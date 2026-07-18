package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByPerformedAtDesc(Pageable p);
    Page<AuditLog> findByEntityNameOrderByPerformedAtDesc(String name, Pageable p);
}
