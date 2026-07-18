package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.incident.Incident;
import com.example.IMS_Backend.incident.IncidentPriority;
import com.example.IMS_Backend.incident.IncidentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    // Used by REPORTER "My Incidents" — incidents they created
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.owner " +
           "LEFT JOIN FETCH i.createdBy " +
           "LEFT JOIN FETCH i.category " +
           "WHERE i.createdBy.id = :userId " +
           "ORDER BY i.createdAt DESC")
    java.util.List<Incident> findByCreatedByIdFetch(@Param("userId") Long userId);

    Page<Incident> findByCreatedById(Long userId, Pageable p);

    // Used by RESOLVER "Assigned to Me" — incidents where they are the owner
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.owner " +
           "LEFT JOIN FETCH i.createdBy " +
           "LEFT JOIN FETCH i.category " +
           "WHERE i.owner.id = :ownerId " +
           "ORDER BY i.updatedAt DESC")
    java.util.List<Incident> findByOwnerIdFetch(@Param("ownerId") Long ownerId);

    Page<Incident> findByOwnerId(Long ownerId, Pageable p);

    Page<Incident> findByStatus(IncidentStatus status, Pageable p);

    // Main search query: JOIN FETCH prevents N+1 problem (ownerName showing null)
    // Separate countQuery required because JOIN FETCH + DISTINCT breaks default count
    @Query(value =
           "SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.owner " +
           "LEFT JOIN FETCH i.createdBy " +
           "LEFT JOIN FETCH i.category " +
           "WHERE (:status   IS NULL OR i.status     = :status)   " +
           "AND   (:priority IS NULL OR i.priority   = :priority) " +
           "AND   (:catId    IS NULL OR i.category.id = :catId)   " +
           "AND   (:ownerId  IS NULL OR i.owner.id   = :ownerId)  " +
           "AND   (:search   IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%',:search,'%')))",
           countQuery =
           "SELECT COUNT(DISTINCT i) FROM Incident i " +
           "WHERE (:status   IS NULL OR i.status     = :status)   " +
           "AND   (:priority IS NULL OR i.priority   = :priority) " +
           "AND   (:catId    IS NULL OR i.category.id = :catId)   " +
           "AND   (:ownerId  IS NULL OR i.owner.id   = :ownerId)  " +
           "AND   (:search   IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<Incident> search(@Param("status")   IncidentStatus   status,
                          @Param("priority") IncidentPriority priority,
                          @Param("catId")    Long             catId,
                          @Param("ownerId")  Long             ownerId,
                          @Param("search")   String           search,
                          Pageable p);

    long countByStatus(IncidentStatus status);
    long countBySlaBreach(Boolean slaBreach);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.createdBy.id = :uid")
    long countByCreatedById(@Param("uid") Long uid);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.owner.id = :uid " +
           "AND i.status NOT IN ('RESOLVED','CLOSED')")
    long countOpenByOwnerId(@Param("uid") Long uid);
}
