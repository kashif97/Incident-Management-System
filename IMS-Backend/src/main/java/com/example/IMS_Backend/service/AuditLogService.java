package com.example.IMS_Backend.service;

import com.example.IMS_Backend.audit.AuditLog;
import com.example.IMS_Backend.dto.AuditLogResponse;
import com.example.IMS_Backend.dto.PageResponse;
import com.example.IMS_Backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditRepo;

    public PageResponse<AuditLogResponse> getAuditLogs(int page, int size) {
        Page<AuditLog> pg = auditRepo.findAllByOrderByPerformedAtDesc(PageRequest.of(page, size));
        List<AuditLogResponse> content = pg.getContent().stream().map(this::toResponse).toList();
        return PageResponse.<AuditLogResponse>builder()
                .content(content).page(pg.getNumber()).size(pg.getSize())
                .totalElements(pg.getTotalElements()).totalPages(pg.getTotalPages())
                .last(pg.isLast()).build();
    }

    private AuditLogResponse toResponse(AuditLog l) {
        return AuditLogResponse.builder()
                .logId(l.getId()).entityName(l.getEntityName())
                .entityId(l.getEntityId()).action(l.getAction())
                .oldValue(l.getOldValue()).newValue(l.getNewValue())
                .performedBy(l.getPerformedBy() != null ? l.getPerformedBy().getFullName() : "System")
                .performedAt(l.getPerformedAt()).build();
    }
}
