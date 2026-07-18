package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.incident.IncidentPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateIncidentRequest {
    @NotBlank private String title;
    @NotBlank private String description;
    @NotNull  private IncidentPriority priority;
    private Long categoryId;
}
