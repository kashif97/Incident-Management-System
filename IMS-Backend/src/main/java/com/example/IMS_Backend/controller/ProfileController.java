package com.example.IMS_Backend.controller;

import com.example.IMS_Backend.auth.AuthPrincipal;
import com.example.IMS_Backend.dto.ApiResponse;
import com.example.IMS_Backend.dto.UpdateUserRequest;
import com.example.IMS_Backend.dto.UserResponse;
import com.example.IMS_Backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(principal.getUserId())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @Valid @RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        // Users can update their own profile (fullName, phone, location)
        return ResponseEntity.ok(ApiResponse.ok("Profile updated",
                userService.updateOwnProfile(principal.getUserId(), req)));
    }
}
