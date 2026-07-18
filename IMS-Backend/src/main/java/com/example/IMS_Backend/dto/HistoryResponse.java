package com.example.IMS_Backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class HistoryResponse {
    private Long historyId;
    private String oldStatus;
    private String newStatus;
    private String changedByName;
    private String changeNote;
    private LocalDateTime changedAt;
}
