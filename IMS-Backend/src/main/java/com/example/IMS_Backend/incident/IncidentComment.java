package com.example.IMS_Backend.incident;

import com.example.IMS_Backend.rbac.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "INCIDENT_COMMENTS")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IncidentComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Lob
    @Column(name = "comment_text", nullable = false)
    private String commentText;

    @Column(name = "is_internal", nullable = false)
    private Boolean isInternal = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commented_by", nullable = false)
    private User commentedBy;

    @Column(name = "commented_at", nullable = false)
    private LocalDateTime commentedAt;

    @PrePersist
    void onCreate() { commentedAt = LocalDateTime.now(); }
}
