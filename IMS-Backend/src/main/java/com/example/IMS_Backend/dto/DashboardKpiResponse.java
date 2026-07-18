package com.example.IMS_Backend.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardKpiResponse {
    private long totalIncidents;
    private long newIncidents;
    private long openIncidents;
    private long inProgressIncidents;
    private long resolvedIncidents;
    private long closedIncidents;
    private long escalatedIncidents;
    private long slaBreaches;
    private long myOpenIncidents;
    private long totalUsers;
    private long activeUsers;
}