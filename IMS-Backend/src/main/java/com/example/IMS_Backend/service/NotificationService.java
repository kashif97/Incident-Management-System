package com.example.IMS_Backend.service;

import com.example.IMS_Backend.dto.NotificationResponse;
import com.example.IMS_Backend.exception.AppExceptions.*;
import com.example.IMS_Backend.notification.Notification;
import com.example.IMS_Backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notifRepo;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notifRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notifRepo.countByUserIdAndIsReadFalse(userId);
    }

    public void markAllRead(Long userId) {
        List<Notification> unread = notifRepo.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notifRepo.saveAll(unread);
    }

    public void markRead(Long notifId, Long userId) {
        Notification n = notifRepo.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!n.getUser().getId().equals(userId))
            throw new BadRequestException("Not your notification");
        n.setIsRead(true);
        notifRepo.save(n);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getId()).title(n.getTitle()).message(n.getMessage())
                .type(n.getType().name()).isRead(n.getIsRead())
                .incidentId(n.getIncident() != null ? n.getIncident().getId() : null)
                .createdAt(n.getCreatedAt()).build();
    }
}
