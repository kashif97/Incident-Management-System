package com.example.IMS_Backend.controller;

import com.example.IMS_Backend.auth.AuthPrincipal;
import com.example.IMS_Backend.dto.ApiResponse;
import com.example.IMS_Backend.dto.NotificationResponse;
import com.example.IMS_Backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notifService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAll(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(notifService.getMyNotifications(principal.getUserId())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(notifService.getUnreadCount(principal.getUserId())));
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal AuthPrincipal principal) {
        notifService.markAllRead(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        notifService.markRead(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }
}
