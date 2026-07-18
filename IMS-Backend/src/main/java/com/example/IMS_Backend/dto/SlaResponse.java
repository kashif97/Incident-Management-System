package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.incident.IncidentPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaResponse {
    private Long slaId;
    private String slaName;
    private IncidentPriority priority;
    private Integer responseTimeMinutes;
    private Integer resolutionTimeMinutes;
    private Boolean isActive;
}
