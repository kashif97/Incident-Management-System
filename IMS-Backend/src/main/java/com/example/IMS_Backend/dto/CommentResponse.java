package com.example.IMS_Backend.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {
    private Long commentId;
    private String commentText;
    private Boolean isInternal;
    private Long commentedById;
    private String commentedByName;
    private LocalDateTime commentedAt;
}