package com.example.IMS_Backend.repository;

import com.example.IMS_Backend.rbac.Role;
import com.example.IMS_Backend.rbac.RoleCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleCode(RoleCode roleCode);
    List<Role> findByIsActiveTrue();
}
