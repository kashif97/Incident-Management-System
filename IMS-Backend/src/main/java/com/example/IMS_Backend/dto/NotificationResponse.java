package com.example.IMS_Backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {
    private Long notificationId;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private Long incidentId;
    private LocalDateTime createdAt;
}
