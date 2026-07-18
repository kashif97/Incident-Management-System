package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.rbac.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Long> {

    @Query("SELECT ura FROM UserRoleAssignment ura WHERE ura.user.id = :uid " +
           "AND (ura.effectiveTo IS NULL OR ura.effectiveTo > :now)")
    List<UserRoleAssignment> findActiveByUserId(@Param("uid") Long uid, @Param("now") LocalDateTime now);

    Optional<UserRoleAssignment> findByUserIdAndRoleId(Long userId, Long roleId);
}
