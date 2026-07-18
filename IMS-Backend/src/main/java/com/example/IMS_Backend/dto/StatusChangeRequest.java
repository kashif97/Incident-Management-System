package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.incident.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusChangeRequest {
    @NotNull
    private IncidentStatus newStatus;
    private String note;
    private String resolutionNotes;
    private String rootCause;
}