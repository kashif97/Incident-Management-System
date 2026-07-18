package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.incident.IncidentPriority;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateIncidentRequest {
    private String title;
    private String description;
    private IncidentPriority priority;
    private Long categoryId;
}
