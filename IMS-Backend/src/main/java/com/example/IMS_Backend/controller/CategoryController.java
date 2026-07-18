package com.example.IMS_Backend.controller;

import com.example.IMS_Backend.dto.ApiResponse;
import com.example.IMS_Backend.dto.CategoryResponse;
import com.example.IMS_Backend.dto.CreateCategoryRequest;
import com.example.IMS_Backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategories()));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllIncludingInactive() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategoriesIncludingInactive()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> create(
            @Valid @RequestBody CreateCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Category created", categoryService.createCategory(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Category updated", categoryService.updateCategory(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        categoryService.deactivateCategory(id);
        return ResponseEntity.ok(ApiResponse.ok("Category deactivated", null));
    }

    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<ApiResponse<CategoryResponse>> reactivate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Category reactivated", categoryService.reactivateCategory(id)));
    }
}
