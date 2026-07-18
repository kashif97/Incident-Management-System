package com.example.IMS_Backend.service;

import com.example.IMS_Backend.category.Category;
import com.example.IMS_Backend.dto.*;
import com.example.IMS_Backend.exception.AppExceptions.*;
import com.example.IMS_Backend.incident.*;
import com.example.IMS_Backend.notification.Notification;
import com.example.IMS_Backend.rbac.RoleCode;
import com.example.IMS_Backend.rbac.User;
import com.example.IMS_Backend.rbac.UserRoleAssignment;
import com.example.IMS_Backend.repository.*;
import com.example.IMS_Backend.sla.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class IncidentService {

    private final IncidentRepository        incidentRepo;
    private final IncidentHistoryRepository historyRepo;
    private final IncidentCommentRepository commentRepo;
    private final IncidentSlaRepository     incidentSlaRepo;
    private final SlaRepository             slaRepo;
    private final CategoryRepository        categoryRepo;
    private final UserRepository            userRepo;
    private final NotificationRepository    notifRepo;

    public IncidentResponse createIncident(CreateIncidentRequest req, Long creatorId) {
        User creator = userRepo.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateRole(creator, Set.of(RoleCode.REPORTER),
                "Only End Users (Reporters) can raise incidents.");

        Category category = req.getCategoryId() != null
                ? categoryRepo.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"))
                : null;

        Sla sla = slaRepo.findByPriorityAndIsActiveTrue(req.getPriority()).orElse(null);

        Incident incident = Incident.builder()
                .title(req.getTitle()).description(req.getDescription())
                .priority(req.getPriority()).status(IncidentStatus.NEW)
                .category(category).createdBy(creator)
                .sla(sla).slaBreach(false).build();
        incident = incidentRepo.save(incident);

        recordHistory(incident, null, IncidentStatus.NEW, creator, "Incident raised by reporter");

        if (sla != null) {
            incidentSlaRepo.save(IncidentSla.builder()
                    .incident(incident).sla(sla)
                    .responseDueAt(LocalDateTime.now().plusMinutes(sla.getResponseTimeMinutes()))
                    .resolutionDueAt(LocalDateTime.now().plusMinutes(sla.getResolutionTimeMinutes()))
                    .build());
        }

        return toResponse(incident);
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentSummaryResponse> getIncidents(
            IncidentStatus status, IncidentPriority priority,
            Long categoryId, Long ownerId, String search, int page, int size) {
        Page<Incident> pg = incidentRepo.search(status, priority, categoryId, ownerId, search,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPage(pg);
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentSummaryResponse> getMyIncidents(Long userId, int page, int size) {
        Page<Incident> pg = incidentRepo.findByCreatedById(userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPage(pg);
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentSummaryResponse> getAssignedToMe(Long userId, int page, int size) {
        Page<Incident> pg = incidentRepo.findByOwnerId(userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPage(pg);
    }

    @Transactional(readOnly = true)
    public IncidentResponse getIncidentById(Long id) {
        return toResponse(findIncident(id));
    }

    public IncidentResponse assignIncident(Long id, AssignIncidentRequest req, Long actorId) {
        Incident inc = findIncident(id);
        User actor   = findUser(actorId);
        User owner   = findUser(req.getOwnerId());

        validateRole(actor, Set.of(RoleCode.INC_MANAGER, RoleCode.ADMIN),
                "Only Incident Managers can assign incidents");

        IncidentStatus old = inc.getStatus();
        inc.setOwner(owner);
        inc.setAssignedGroup(req.getAssignedGroup());
        inc.setStatus(IncidentStatus.ASSIGNED);
        incidentRepo.save(inc);

        // Stamp firstResponseAt if this is the first action
        recordFirstResponse(inc);

        recordHistory(inc, old, IncidentStatus.ASSIGNED, actor,
                req.getNote() != null ? req.getNote() : "Assigned to " + owner.getFullName());
        pushNotif(owner, inc, Notification.NotifType.INCIDENT_ASSIGNED,
                "Incident Assigned to You",
                "Incident #" + id + " — " + inc.getTitle() + " has been assigned to you.");
        return toResponse(inc);
    }

    public IncidentResponse changeStatus(Long id, StatusChangeRequest req, Long actorId) {
        Incident inc  = findIncident(id);
        User actor    = findUser(actorId);
        IncidentStatus newStatus = req.getNewStatus();
        IncidentStatus old       = inc.getStatus();

        switch (newStatus) {
            case LOGGED -> validateRole(actor, Set.of(RoleCode.INC_MANAGER, RoleCode.ADMIN),
                    "Only Incident Managers can log incidents");
            case CATEGORIZED -> validateRole(actor, Set.of(RoleCode.INC_MANAGER, RoleCode.ADMIN),
                    "Only Incident Managers can categorize incidents");
            case ASSIGNED -> throw new BadRequestException(
                    "Use the /assign endpoint to assign incidents");
            case IN_PROGRESS -> validateRole(actor, Set.of(RoleCode.RESOLVER, RoleCode.INC_MANAGER, RoleCode.ADMIN),
                    "Only Resolvers or Incident Managers can start work on an incident");
            case RESOLVED -> validateRole(actor, Set.of(RoleCode.RESOLVER, RoleCode.INC_MANAGER, RoleCode.ADMIN),
                    "Only Resolvers or Incident Managers can resolve incidents");
            case CLOSED -> validateRole(actor, Set.of(RoleCode.INC_MANAGER, RoleCode.ADMIN),
                    "Only Incident Managers can close incidents");
            case REOPENED -> validateRole(actor, Set.of(RoleCode.INC_MANAGER, RoleCode.ADMIN),
                    "Only Incident Managers can reopen incidents");
            case ESCALATED -> validateRole(actor, Set.of(RoleCode.INC_MANAGER, RoleCode.ADMIN),
                    "Only Incident Managers can escalate incidents");
        }

        inc.setStatus(newStatus);
        if (req.getResolutionNotes() != null) inc.setResolutionNotes(req.getResolutionNotes());
        if (req.getRootCause()       != null) inc.setRootCause(req.getRootCause());
        if (newStatus == IncidentStatus.RESOLVED) {
            inc.setResolvedAt(LocalDateTime.now());
            // Stamp SLA resolved time
            incidentSlaRepo.findByIncidentId(inc.getId()).ifPresent(isla -> {
                isla.setResolvedAt(LocalDateTime.now());
                incidentSlaRepo.save(isla);
            });
        }
        if (newStatus == IncidentStatus.CLOSED) inc.setClosedAt(LocalDateTime.now());
        incidentRepo.save(inc);

        // Stamp firstResponseAt on first meaningful action
        recordFirstResponse(inc);

        recordHistory(inc, old, newStatus, actor, req.getNote());

        if (inc.getCreatedBy() != null)
            pushNotif(inc.getCreatedBy(), inc, Notification.NotifType.STATUS_CHANGED,
                    "Your Incident Status Changed",
                    "Incident #" + id + " is now " + newStatus.name());
        return toResponse(inc);
    }

    public CommentResponse addComment(Long incidentId, AddCommentRequest req, Long userId) {
        Incident inc      = findIncident(incidentId);
        User commenter    = findUser(userId);

        IncidentComment comment = IncidentComment.builder()
                .incident(inc).commentText(req.getCommentText())
                .isInternal(req.getIsInternal() != null && req.getIsInternal())
                .commentedBy(commenter).build();
        comment = commentRepo.save(comment);

        // Stamp firstResponseAt if commenter is not the reporter
        if (!commenter.getId().equals(inc.getCreatedBy().getId())) {
            recordFirstResponse(inc);
        }

        if (!comment.getIsInternal() && inc.getOwner() != null
                && !inc.getOwner().getId().equals(userId)) {
            pushNotif(inc.getOwner(), inc, Notification.NotifType.COMMENT_ADDED,
                    "New Comment on Incident #" + incidentId, req.getCommentText());
        }
        // Notify reporter on public comments from the team
        if (!comment.getIsInternal() && inc.getCreatedBy() != null
                && !inc.getCreatedBy().getId().equals(userId)) {
            pushNotif(inc.getCreatedBy(), inc, Notification.NotifType.COMMENT_ADDED,
                    "New Comment on Your Incident #" + incidentId,
                    commenter.getFullName() + " commented: " + req.getCommentText());
        }
        return CommentResponse.builder()
                .commentId(comment.getId()).commentText(comment.getCommentText())
                .isInternal(comment.getIsInternal())
                .commentedById(commenter.getId()).commentedByName(commenter.getFullName())
                .commentedAt(comment.getCommentedAt()).build();
    }

    @Transactional(readOnly = true)
    public DashboardKpiResponse getDashboardKpis(Long userId) {
        return DashboardKpiResponse.builder()
                .totalIncidents(incidentRepo.count())
                .newIncidents(incidentRepo.countByStatus(IncidentStatus.NEW))
                .openIncidents(incidentRepo.countByStatus(IncidentStatus.ASSIGNED)
                        + incidentRepo.countByStatus(IncidentStatus.LOGGED)
                        + incidentRepo.countByStatus(IncidentStatus.CATEGORIZED))
                .inProgressIncidents(incidentRepo.countByStatus(IncidentStatus.IN_PROGRESS))
                .resolvedIncidents(incidentRepo.countByStatus(IncidentStatus.RESOLVED))
                .closedIncidents(incidentRepo.countByStatus(IncidentStatus.CLOSED))
                .escalatedIncidents(incidentRepo.countByStatus(IncidentStatus.ESCALATED))
                .slaBreaches(incidentRepo.countBySlaBreach(true))
                .myOpenIncidents(incidentRepo.countOpenByOwnerId(userId))
                .totalUsers(userRepo.count())
                .activeUsers(userRepo.findByStatus(User.UserStatus.ACTIVE).size())
                .build();
    }

    /** Stamps firstResponseAt on the INCIDENT_SLA record (once, on the first non-reporter action). */
    private void recordFirstResponse(Incident inc) {
        incidentSlaRepo.findByIncidentId(inc.getId()).ifPresent(isla -> {
            if (isla.getFirstResponseAt() == null) {
                isla.setFirstResponseAt(LocalDateTime.now());
                incidentSlaRepo.save(isla);
            }
        });
    }

    private Incident findIncident(Long id) {
        return incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));
    }

    private User findUser(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private RoleCode getActiveRoleCode(User user) {
        return user.getRoleAssignments().stream()
                .filter(ra -> ra.getEffectiveTo() == null
                        || ra.getEffectiveTo().isAfter(LocalDateTime.now()))
                .map(UserRoleAssignment::getRole)
                .map(r -> r.getRoleCode())
                .findFirst()
                .orElseThrow(() -> new UnauthorizedException("No active role found"));
    }

    private void validateRole(User user, Set<RoleCode> allowed, String message) {
        RoleCode role = getActiveRoleCode(user);
        if (!allowed.contains(role)) {
            throw new BadRequestException(message);
        }
    }

    private void recordHistory(Incident inc, IncidentStatus old,
                                IncidentStatus newS, User actor, String note) {
        historyRepo.save(IncidentHistory.builder()
                .incident(inc).oldStatus(old).newStatus(newS)
                .changedBy(actor).changeNote(note).build());
    }

    private void pushNotif(User user, Incident inc,
                            Notification.NotifType type, String title, String message) {
        notifRepo.save(Notification.builder()
                .user(user).incident(inc).type(type)
                .title(title).message(message).isRead(false).build());
    }

    private PageResponse<IncidentSummaryResponse> toPage(Page<Incident> pg) {
        List<IncidentSummaryResponse> content = pg.getContent().stream()
                .map(this::toSummary).toList();
        return PageResponse.<IncidentSummaryResponse>builder()
                .content(content).page(pg.getNumber()).size(pg.getSize())
                .totalElements(pg.getTotalElements()).totalPages(pg.getTotalPages())
                .last(pg.isLast()).build();
    }

    private IncidentSummaryResponse toSummary(Incident i) {
        return IncidentSummaryResponse.builder()
                .incidentId(i.getId()).title(i.getTitle())
                .status(i.getStatus()).priority(i.getPriority())
                .categoryName(i.getCategory() != null ? i.getCategory().getCategoryName() : null)
                .ownerName(i.getOwner() != null ? i.getOwner().getFullName() : null)
                .createdByName(i.getCreatedBy() != null ? i.getCreatedBy().getFullName() : null)
                .slaBreach(i.getSlaBreach())
                .createdAt(i.getCreatedAt()).updatedAt(i.getUpdatedAt()).build();
    }

    private IncidentResponse toResponse(Incident i) {
        IncidentSla sla = incidentSlaRepo.findByIncidentId(i.getId()).orElse(null);

        List<CommentResponse> comments = commentRepo
                .findByIncidentIdOrderByCommentedAtAsc(i.getId()).stream()
                .map(c -> CommentResponse.builder()
                        .commentId(c.getId()).commentText(c.getCommentText())
                        .isInternal(c.getIsInternal())
                        .commentedById(c.getCommentedBy().getId())
                        .commentedByName(c.getCommentedBy().getFullName())
                        .commentedAt(c.getCommentedAt()).build()).toList();

        List<HistoryResponse> history = historyRepo
                .findByIncidentIdOrderByChangedAtAsc(i.getId()).stream()
                .map(h -> HistoryResponse.builder()
                        .historyId(h.getId())
                        .oldStatus(h.getOldStatus() != null ? h.getOldStatus().name() : null)
                        .newStatus(h.getNewStatus().name())
                        .changedByName(h.getChangedBy().getFullName())
                        .changeNote(h.getChangeNote())
                        .changedAt(h.getChangedAt()).build()).toList();

        return IncidentResponse.builder()
                .incidentId(i.getId()).title(i.getTitle()).description(i.getDescription())
                .status(i.getStatus()).priority(i.getPriority())
                .categoryId(i.getCategory() != null ? i.getCategory().getId() : null)
                .categoryName(i.getCategory() != null ? i.getCategory().getCategoryName() : null)
                .ownerId(i.getOwner() != null ? i.getOwner().getId() : null)
                .ownerName(i.getOwner() != null ? i.getOwner().getFullName() : null)
                .assignedGroup(i.getAssignedGroup())
                .createdById(i.getCreatedBy().getId())
                .createdByName(i.getCreatedBy().getFullName())
                .slaBreach(i.getSlaBreach())
                .resolutionNotes(i.getResolutionNotes()).rootCause(i.getRootCause())
                .createdAt(i.getCreatedAt()).updatedAt(i.getUpdatedAt())
                .resolvedAt(i.getResolvedAt()).closedAt(i.getClosedAt())
                .slaResponseDue(sla != null ? sla.getResponseDueAt() : null)
                .slaResolutionDue(sla != null ? sla.getResolutionDueAt() : null)
                .responseBreached(sla != null && sla.getResponseBreached())
                .resolutionBreached(sla != null && sla.getResolutionBreached())
                .firstResponseAt(sla != null ? sla.getFirstResponseAt() : null)
                .comments(comments).history(history).build();
    }
}
