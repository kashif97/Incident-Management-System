package com.example.IMS_Backend.service;

import com.example.IMS_Backend.dto.ReportResponse;
import com.example.IMS_Backend.incident.Incident;
import com.example.IMS_Backend.incident.IncidentStatus;
import com.example.IMS_Backend.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final IncidentRepository incidentRepo;

    public ReportResponse generateReport() {
        List<Incident> all = incidentRepo.findAll();

        long total      = all.size();
        long closed     = all.stream().filter(i -> i.getStatus() == IncidentStatus.CLOSED).count();
        long open       = all.stream().filter(i -> !Set.of(IncidentStatus.CLOSED, IncidentStatus.RESOLVED).contains(i.getStatus())).count();
        long breaches   = all.stream().filter(Incident::getSlaBreach).count();
        long escalated  = all.stream().filter(i -> i.getStatus() == IncidentStatus.ESCALATED).count();

        // MTTR — only for closed incidents with both timestamps
        List<Long> mttrList = all.stream()
                .filter(i -> i.getStatus() == IncidentStatus.CLOSED
                          && i.getCreatedAt() != null && i.getClosedAt() != null)
                .map(i -> Duration.between(i.getCreatedAt(), i.getClosedAt()).toMinutes())
                .collect(Collectors.toList());
        Double avgMttr = mttrList.isEmpty() ? null
                : mttrList.stream().mapToLong(Long::longValue).average().orElse(0);

        // Average response time — resolved + closed incidents with resolvedAt
        List<Long> responseList = all.stream()
                .filter(i -> i.getCreatedAt() != null && i.getResolvedAt() != null)
                .map(i -> Duration.between(i.getCreatedAt(), i.getResolvedAt()).toMinutes())
                .collect(Collectors.toList());
        Double avgResponse = responseList.isEmpty() ? null
                : responseList.stream().mapToLong(Long::longValue).average().orElse(0);

        // SLA compliance % = non-breached / total * 100
        double slaCompliance = total == 0 ? 100.0
                : Math.round(((total - breaches) * 100.0 / total) * 10) / 10.0;

        // Breakdown by status
        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(i -> i.getStatus().name(), Collectors.counting()));

        // Breakdown by priority
        Map<String, Long> byPriority = all.stream()
                .collect(Collectors.groupingBy(i -> i.getPriority().name(), Collectors.counting()));

        // Breakdown by category
        Map<String, Long> byCategory = all.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getCategory() != null ? i.getCategory().getCategoryName() : "Uncategorized",
                        Collectors.counting()));

        // Top resolvers
        List<ReportResponse.ResolverStat> topResolvers = all.stream()
                .filter(i -> i.getOwner() != null
                          && (i.getStatus() == IncidentStatus.RESOLVED || i.getStatus() == IncidentStatus.CLOSED))
                .collect(Collectors.groupingBy(i -> i.getOwner().getFullName()))
                .entrySet().stream()
                .map(e -> {
                    List<Incident> resolved = e.getValue();
                    List<Long> durations = resolved.stream()
                            .filter(i -> i.getCreatedAt() != null && i.getResolvedAt() != null)
                            .map(i -> Duration.between(i.getCreatedAt(), i.getResolvedAt()).toMinutes())
                            .collect(Collectors.toList());
                    Double avg = durations.isEmpty() ? null
                            : durations.stream().mapToLong(Long::longValue).average().orElse(0);
                    return ReportResponse.ResolverStat.builder()
                            .resolverName(e.getKey())
                            .resolved((long) resolved.size())
                            .avgMttrMinutes(avg)
                            .build();
                })
                .sorted(Comparator.comparingLong(ReportResponse.ResolverStat::getResolved).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return ReportResponse.builder()
                .totalIncidents(total)
                .closedIncidents(closed)
                .openIncidents(open)
                .slaBreaches(breaches)
                .escalatedIncidents(escalated)
                .avgMttrMinutes(avgMttr)
                .avgResponseTimeMinutes(avgResponse)
                .slaCompliancePercent(slaCompliance)
                .byStatus(byStatus)
                .byPriority(byPriority)
                .byCategory(byCategory)
                .topResolvers(topResolvers)
                .build();
    }
}
