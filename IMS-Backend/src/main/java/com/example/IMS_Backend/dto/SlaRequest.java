package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.incident.IncidentPriority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaRequest {
    @NotBlank
    private String slaName;
    @NotNull
    private IncidentPriority priority;
    @NotNull @Min(1) private Integer responseTimeMinutes;
    @NotNull @Min(1) private Integer resolutionTimeMinutes;
}