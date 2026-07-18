package com.example.IMS_Backend.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportResponse {
    // Incident volume
    private long totalIncidents;
    private long closedIncidents;
    private long openIncidents;
    private long slaBreaches;
    private long escalatedIncidents;

    // MTTR (Mean Time To Resolve) in minutes
    private Double avgMttrMinutes;
    private Double avgResponseTimeMinutes;

    // Breakdown maps  key → count
    private Map<String, Long> byStatus;
    private Map<String, Long> byPriority;
    private Map<String, Long> byCategory;

    // SLA compliance %
    private Double slaCompliancePercent;

    // Top resolvers
    private List<ResolverStat> topResolvers;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ResolverStat {
        private String resolverName;
        private long   resolved;
        private Double avgMttrMinutes;
    }
}
