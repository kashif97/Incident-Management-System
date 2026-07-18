package com.example.IMS_Backend.service;

import com.example.IMS_Backend.auth.JwtUtil;
import com.example.IMS_Backend.dto.AuthResponse;
import com.example.IMS_Backend.dto.LoginRequest;
import com.example.IMS_Backend.exception.AppExceptions.*;
import com.example.IMS_Backend.rbac.*;
import com.example.IMS_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository  userRepo;
    private final JwtUtil         jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByUsername(req.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (user.getStatus() == User.UserStatus.LOCKED)
            throw new UnauthorizedException("Account is locked. Contact admin.");
        if (user.getStatus() == User.UserStatus.INACTIVE)
            throw new UnauthorizedException("Account is inactive. Contact admin.");

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash()))
            throw new UnauthorizedException("Invalid username or password");

        UserRoleAssignment activeAssignment = user.getRoleAssignments().stream()
                .filter(ra -> ra.getEffectiveTo() == null
                        || ra.getEffectiveTo().isAfter(LocalDateTime.now()))
                .findFirst()
                .orElseThrow(() -> new UnauthorizedException("No active role assigned. Contact admin."));

        RoleCode roleCode = activeAssignment.getRole().getRoleCode();
        String   roleName = activeAssignment.getRole().getRoleName();

        user.setLastLoginAt(LocalDateTime.now());
        userRepo.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roleCode);

        return AuthResponse.builder()
                .token(token).tokenType("Bearer")
                .userId(user.getId()).username(user.getUsername())
                .fullName(user.getFullName()).email(user.getEmail())
                .roleCode(roleCode).roleName(roleName)
                .build();
    }
}
