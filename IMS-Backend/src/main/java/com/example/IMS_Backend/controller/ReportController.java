package com.example.IMS_Backend.controller;

import com.example.IMS_Backend.dto.ApiResponse;
import com.example.IMS_Backend.dto.ReportResponse;
import com.example.IMS_Backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReportResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.generateReport()));
    }
}
