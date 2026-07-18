package com.example.IMS_Backend.controller;

import com.example.IMS_Backend.auth.AuthPrincipal;
import com.example.IMS_Backend.dto.*;
import com.example.IMS_Backend.incident.IncidentPriority;
import com.example.IMS_Backend.incident.IncidentStatus;
import com.example.IMS_Backend.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping
    public ResponseEntity<ApiResponse<IncidentResponse>> create(
            @Valid @RequestBody CreateIncidentRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Incident created",
                        incidentService.createIncident(req, principal.getUserId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<IncidentSummaryResponse>>> list(
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) IncidentPriority priority,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                incidentService.getIncidents(status, priority, categoryId, ownerId, search, page, size)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<IncidentSummaryResponse>>> myIncidents(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                incidentService.getMyIncidents(principal.getUserId(), page, size)));
    }

    @GetMapping("/assigned-to-me")
    public ResponseEntity<ApiResponse<PageResponse<IncidentSummaryResponse>>> assignedToMe(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                incidentService.getAssignedToMe(principal.getUserId(), page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(incidentService.getIncidentById(id)));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<IncidentResponse>> assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignIncidentRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Incident assigned",
                incidentService.assignIncident(id, req, principal.getUserId())));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<IncidentResponse>> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusChangeRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated",
                incidentService.changeStatus(id, req, principal.getUserId())));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Comment added",
                incidentService.addComment(id, req, principal.getUserId())));
    }

    @GetMapping("/dashboard/kpi")
    public ResponseEntity<ApiResponse<DashboardKpiResponse>> kpi(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                incidentService.getDashboardKpis(principal.getUserId())));
    }
}
