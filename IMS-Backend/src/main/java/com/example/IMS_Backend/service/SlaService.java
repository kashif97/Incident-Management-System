package com.example.IMS_Backend.service;

import com.example.IMS_Backend.dto.SlaRequest;
import com.example.IMS_Backend.dto.SlaResponse;
import com.example.IMS_Backend.exception.AppExceptions.*;
import com.example.IMS_Backend.incident.Incident;
import com.example.IMS_Backend.incident.IncidentStatus;
import com.example.IMS_Backend.notification.Notification;
import com.example.IMS_Backend.repository.*;
import com.example.IMS_Backend.sla.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SlaService {

    private final SlaRepository         slaRepo;
    private final IncidentSlaRepository incidentSlaRepo;
    private final IncidentRepository    incidentRepo;
    private final NotificationRepository notifRepo;

    @Transactional(readOnly = true)
    public List<SlaResponse> getAllSlas() {
        return slaRepo.findByIsActiveTrue().stream().map(this::toResponse).toList();
    }

    public SlaResponse createSla(SlaRequest req) {
        Sla sla = Sla.builder()
                .slaName(req.getSlaName()).priority(req.getPriority())
                .responseTimeMinutes(req.getResponseTimeMinutes())
                .resolutionTimeMinutes(req.getResolutionTimeMinutes())
                .isActive(true).build();
        return toResponse(slaRepo.save(sla));
    }

    public SlaResponse updateSla(Long id, SlaRequest req) {
        Sla sla = slaRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SLA not found: " + id));
        sla.setSlaName(req.getSlaName());
        sla.setPriority(req.getPriority());
        sla.setResponseTimeMinutes(req.getResponseTimeMinutes());
        sla.setResolutionTimeMinutes(req.getResolutionTimeMinutes());
        return toResponse(slaRepo.save(sla));
    }

    public void deactivateSla(Long id) {
        Sla sla = slaRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SLA not found: " + id));
        sla.setIsActive(false);
        slaRepo.save(sla);
    }

    /**
     * Runs every 5 minutes.
     * Checks BOTH response-time breaches AND resolution-time breaches.
     */
    @Scheduled(fixedRate = 300_000)
    public void checkSlaBreaches() {
        LocalDateTime now = LocalDateTime.now();

        // ── Resolution breach check ──────────────────────────────────────────
        List<IncidentSla> resolutionDue = incidentSlaRepo
                .findByResolutionBreachedFalseAndResolutionDueAtBefore(now);
        for (IncidentSla isla : resolutionDue) {
            Incident inc = isla.getIncident();
            if (inc.getStatus() != IncidentStatus.RESOLVED &&
                inc.getStatus() != IncidentStatus.CLOSED) {
                isla.setResolutionBreached(true);
                incidentSlaRepo.save(isla);
                inc.setSlaBreach(true);
                incidentRepo.save(inc);
                if (inc.getOwner() != null) {
                    notifRepo.save(Notification.builder()
                            .user(inc.getOwner()).incident(inc)
                            .type(Notification.NotifType.SLA_BREACH)
                            .title("⚠️ SLA Resolution Breach — Incident #" + inc.getId())
                            .message("Incident #" + inc.getId() + " \"" + inc.getTitle() +
                                     "\" has exceeded its resolution SLA deadline.")
                            .isRead(false).build());
                }
                // Also notify the creator (reporter)
                if (inc.getCreatedBy() != null && (inc.getOwner() == null ||
                        !inc.getCreatedBy().getId().equals(inc.getOwner().getId()))) {
                    notifRepo.save(Notification.builder()
                            .user(inc.getCreatedBy()).incident(inc)
                            .type(Notification.NotifType.SLA_BREACH)
                            .title("⚠️ Your incident SLA has been breached — #" + inc.getId())
                            .message("Incident #" + inc.getId() + " \"" + inc.getTitle() +
                                     "\" has breached its resolution deadline. The team is working on it.")
                            .isRead(false).build());
                }
            }
        }

        // ── Response breach check ────────────────────────────────────────────
        List<IncidentSla> responseDue = incidentSlaRepo
                .findByResponseBreachedFalseAndResponseDueAtBeforeAndFirstResponseAtIsNull(now);
        for (IncidentSla isla : responseDue) {
            Incident inc = isla.getIncident();
            if (inc.getStatus() == IncidentStatus.NEW) {
                isla.setResponseBreached(true);
                incidentSlaRepo.save(isla);
                // Mark global breach flag if not already set
                if (!inc.getSlaBreach()) {
                    inc.setSlaBreach(true);
                    incidentRepo.save(inc);
                }
                if (inc.getOwner() != null) {
                    notifRepo.save(Notification.builder()
                            .user(inc.getOwner()).incident(inc)
                            .type(Notification.NotifType.SLA_BREACH)
                            .title("⚠️ SLA Response Breach — Incident #" + inc.getId())
                            .message("No first response recorded for Incident #" + inc.getId() +
                                     " \"" + inc.getTitle() + "\". Response deadline has passed.")
                            .isRead(false).build());
                }
            }
        }
    }

    private SlaResponse toResponse(Sla s) {
        return SlaResponse.builder()
                .slaId(s.getId()).slaName(s.getSlaName()).priority(s.getPriority())
                .responseTimeMinutes(s.getResponseTimeMinutes())
                .resolutionTimeMinutes(s.getResolutionTimeMinutes())
                .isActive(s.getIsActive()).build();
    }
}
