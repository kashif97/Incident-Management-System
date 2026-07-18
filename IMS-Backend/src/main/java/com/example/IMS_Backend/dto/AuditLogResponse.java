package com.example.IMS_Backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLogResponse {
    private Long logId;
    private String entityName;
    private String entityId;
    private String action;
    private String oldValue;
    private String newValue;
    private String performedBy;
    private LocalDateTime performedAt;
}
