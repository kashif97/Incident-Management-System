package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.incident.IncidentPriority;
import com.example.IMS_Backend.incident.IncidentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentSummaryResponse {
    private Long incidentId;
    private String title;
    private IncidentStatus status;
    private IncidentPriority priority;
    private String categoryName;
    private String ownerName;
    private String createdByName;
    private Boolean slaBreach;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
