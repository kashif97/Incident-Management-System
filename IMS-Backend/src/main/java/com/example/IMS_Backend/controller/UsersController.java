package com.example.IMS_Backend.controller;

import com.example.IMS_Backend.dto.ApiResponse;
import com.example.IMS_Backend.dto.UserResponse;
import com.example.IMS_Backend.rbac.RoleCode;
import com.example.IMS_Backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserService userService;

    
    @GetMapping("/by-role/{roleCode}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> usersByRole(
            @PathVariable RoleCode roleCode) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUsersByRole(roleCode)));
    }
}
