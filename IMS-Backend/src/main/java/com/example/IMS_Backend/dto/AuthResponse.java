package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.rbac.RoleCode;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private RoleCode roleCode;
    private String roleName;
}
