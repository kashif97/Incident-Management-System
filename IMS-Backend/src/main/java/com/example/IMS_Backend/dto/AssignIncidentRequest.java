package com.example.IMS_Backend.dto;


import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class AssignIncidentRequest {
    @NotNull
    private Long ownerId;
    private String assignedGroup;
    private String note;
}