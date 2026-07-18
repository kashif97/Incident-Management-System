package com.example.IMS_Backend.controller;

import com.example.IMS_Backend.auth.AuthPrincipal;
import com.example.IMS_Backend.dto.*;
import com.example.IMS_Backend.rbac.RoleCode;
import com.example.IMS_Backend.service.AuditLogService;
import com.example.IMS_Backend.service.SlaService;
import com.example.IMS_Backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final SlaService slaService;
    private final AuditLogService auditLogService;

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("User created",
                userService.createUser(req, principal.getUserId())));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers(page, size)));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(id)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("User updated",
                userService.updateUser(id, req, principal.getUserId())));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        userService.deactivateUser(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("User deactivated", null));
    }

    @GetMapping("/users/by-role/{roleCode}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> usersByRole(@PathVariable RoleCode roleCode) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUsersByRole(roleCode)));
    }

    @GetMapping("/slas")
    public ResponseEntity<ApiResponse<List<SlaResponse>>> listSlas() {
        return ResponseEntity.ok(ApiResponse.ok(slaService.getAllSlas()));
    }

    @PostMapping("/slas")
    public ResponseEntity<ApiResponse<SlaResponse>> createSla(@Valid @RequestBody SlaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("SLA created", slaService.createSla(req)));
    }

    @PutMapping("/slas/{id}")
    public ResponseEntity<ApiResponse<SlaResponse>> updateSla(@PathVariable Long id,
                                                              @Valid @RequestBody SlaRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("SLA updated", slaService.updateSla(id, req)));
    }

    @DeleteMapping("/slas/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateSla(@PathVariable Long id) {
        slaService.deactivateSla(id);
        return ResponseEntity.ok(ApiResponse.ok("SLA deactivated", null));
    }

    @GetMapping("/audit")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> audit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getAuditLogs(page, size)));
    }
}
