package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.rbac.RoleCode;
import com.example.IMS_Backend.rbac.User.UserStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String department;
    private String employeeId;
    private String location;
    private UserStatus status;
    private RoleCode roleCode;
    private String roleName;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
