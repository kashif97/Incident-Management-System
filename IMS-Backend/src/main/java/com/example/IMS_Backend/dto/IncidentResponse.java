package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.incident.IncidentPriority;
import com.example.IMS_Backend.incident.IncidentStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IncidentResponse {
    private Long   incidentId;
    private String title;
    private String description;
    private IncidentStatus   status;
    private IncidentPriority priority;
    private Long   categoryId;
    private String categoryName;
    private Long   ownerId;
    private String ownerName;
    private String assignedGroup;
    private Long   createdById;
    private String createdByName;
    private Boolean slaBreach;
    private String resolutionNotes;
    private String rootCause;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    // SLA fields
    private LocalDateTime slaResponseDue;
    private LocalDateTime slaResolutionDue;
    private LocalDateTime firstResponseAt;
    private Boolean responseBreached;
    private Boolean resolutionBreached;
    // Relations
    private List<CommentResponse> comments;
    private List<HistoryResponse> history;
}
