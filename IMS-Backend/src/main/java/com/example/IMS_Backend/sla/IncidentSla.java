package com.example.IMS_Backend.sla;

import com.example.IMS_Backend.incident.Incident;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "INCIDENT_SLA")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IncidentSla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false, unique = true)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sla_id", nullable = false)
    private Sla sla;

    @Column(name = "response_due_at", nullable = false)
    private LocalDateTime responseDueAt;

    @Column(name = "resolution_due_at", nullable = false)
    private LocalDateTime resolutionDueAt;

    @Column(name = "first_response_at")
    private LocalDateTime firstResponseAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "response_breached", nullable = false)
    private Boolean responseBreached = false;

    @Column(name = "resolution_breached", nullable = false)
    private Boolean resolutionBreached = false;

    @PrePersist
    protected void onCreate() {
        if (this.responseBreached == null) {
            this.responseBreached = false;
        }
        if (this.resolutionBreached == null) {
            this.resolutionBreached = false;
        }
    }
}
