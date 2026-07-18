package com.example.IMS_Backend.auth;

import com.example.IMS_Backend.rbac.RoleCode;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthPrincipal {
    private Long userId;
    private String username;
    private RoleCode roleCode;
}