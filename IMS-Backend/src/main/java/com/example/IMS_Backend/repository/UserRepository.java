package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.rbac.RoleCode;
import com.example.IMS_Backend.rbac.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByStatus(User.UserStatus status);

    @Query("SELECT u FROM User u JOIN u.roleAssignments ra JOIN ra.role r " +
           "WHERE r.roleCode = :code AND (ra.effectiveTo IS NULL OR ra.effectiveTo > :now)")
    List<User> findActiveUsersByRoleCode(@Param("code") RoleCode code, @Param("now") LocalDateTime now);
}
