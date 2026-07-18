package com.example.IMS_Backend.service;

import com.example.IMS_Backend.audit.AuditLog;
import com.example.IMS_Backend.dto.*;
import com.example.IMS_Backend.exception.AppExceptions.*;
import com.example.IMS_Backend.rbac.*;
import com.example.IMS_Backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final UserRoleAssignmentRepository assignRepo;
    private final AuditLogRepository auditRepo;
    private final PasswordEncoder encoder;

    public UserResponse createUser(CreateUserRequest req, Long adminId) {
        if (userRepo.existsByUsername(req.getUsername()))
            throw new ConflictException("Username already exists: " + req.getUsername());
        if (userRepo.existsByEmail(req.getEmail()))
            throw new ConflictException("Email already exists: " + req.getEmail());

        Role role = roleRepo.findByRoleCode(req.getRoleCode())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + req.getRoleCode()));
        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        User user = User.builder()
                .username(req.getUsername()).email(req.getEmail())
                .passwordHash(encoder.encode(req.getPassword()))
                .fullName(req.getFullName()).phone(req.getPhone())
                .department(req.getDepartment()).employeeId(req.getEmployeeId())
                .location(req.getLocation()).status(User.UserStatus.ACTIVE)
                .build();
        user = userRepo.save(user);

        assignRepo.save(UserRoleAssignment.builder()
                .user(user).role(role)
                .effectiveFrom(LocalDateTime.now())
                .assignedBy(admin).build());

        auditRepo.save(AuditLog.builder().entityName("USER").entityId(user.getId().toString())
                .action("USER_CREATED").newValue("username=" + user.getUsername())
                .performedBy(admin).build());

        return toUserResponse(user, role);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(int page, int size) {
        Page<User> pg = userRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        List<UserResponse> content = pg.getContent().stream()
                .map(u -> toUserResponse(u, getActiveRole(u))).toList();
        return PageResponse.<UserResponse>builder().content(content).page(pg.getNumber())
                .size(pg.getSize()).totalElements(pg.getTotalElements())
                .totalPages(pg.getTotalPages()).last(pg.isLast()).build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return toUserResponse(u, getActiveRole(u));
    }

    public UserResponse updateUser(Long id, UpdateUserRequest req, Long adminId) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        applyUpdates(user, req);
        userRepo.save(user);
        auditRepo.save(AuditLog.builder().entityName("USER").entityId(id.toString())
                .action("USER_UPDATED").performedBy(admin).build());
        return toUserResponse(user, getActiveRole(user));
    }

    /** Self-service profile update — users updating their own profile (no admin audit needed for dept/status). */
    public UserResponse updateOwnProfile(Long userId, UpdateUserRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        // Self-service: only allow updating fullName, phone, location — not status or department
        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getPhone()    != null) user.setPhone(req.getPhone());
        if (req.getLocation() != null) user.setLocation(req.getLocation());
        // Department can be updated by self too
        if (req.getDepartment() != null) user.setDepartment(req.getDepartment());
        userRepo.save(user);
        return toUserResponse(user, getActiveRole(user));
    }

    public void deactivateUser(Long id, Long adminId) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        user.setStatus(User.UserStatus.INACTIVE);
        userRepo.save(user);
        auditRepo.save(AuditLog.builder().entityName("USER").entityId(id.toString())
                .action("USER_DEACTIVATED").performedBy(admin).build());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(RoleCode code) {
        return userRepo.findActiveUsersByRoleCode(code, LocalDateTime.now())
                .stream().map(u -> toUserResponse(u, getActiveRole(u))).toList();
    }

    private void applyUpdates(User user, UpdateUserRequest req) {
        if (req.getFullName()   != null) user.setFullName(req.getFullName());
        if (req.getPhone()      != null) user.setPhone(req.getPhone());
        if (req.getDepartment() != null) user.setDepartment(req.getDepartment());
        if (req.getLocation()   != null) user.setLocation(req.getLocation());
        if (req.getStatus()     != null) user.setStatus(req.getStatus());
    }

    private Role getActiveRole(User user) {
        return user.getRoleAssignments().stream()
                .filter(ra -> ra.getEffectiveTo() == null
                        || ra.getEffectiveTo().isAfter(LocalDateTime.now()))
                .map(UserRoleAssignment::getRole).findFirst().orElse(null);
    }

    private UserResponse toUserResponse(User u, Role r) {
        return UserResponse.builder()
                .userId(u.getId()).username(u.getUsername()).email(u.getEmail())
                .fullName(u.getFullName()).phone(u.getPhone()).department(u.getDepartment())
                .employeeId(u.getEmployeeId()).location(u.getLocation()).status(u.getStatus())
                .roleCode(r != null ? r.getRoleCode() : null)
                .roleName(r != null ? r.getRoleName() : null)
                .lastLoginAt(u.getLastLoginAt()).createdAt(u.getCreatedAt()).build();
    }
}
