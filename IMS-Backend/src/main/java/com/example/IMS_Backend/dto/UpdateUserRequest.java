package com.example.IMS_Backend.dto;

import com.example.IMS_Backend.rbac.User.UserStatus;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUserRequest {
    private String fullName;
    private String phone;
    private String department;
    private String location;
    private UserStatus status;
}
