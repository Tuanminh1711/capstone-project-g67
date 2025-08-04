package com.plantcare_backend.controller.expert;

import com.plantcare_backend.dto.request.expert.CreateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.ChangeCategoryStatusRequestDTO;
import com.plantcare_backend.dto.request.expert.CreateArticleRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.expert.CategoryDetailResponse;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.service.ExpertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expert")
@Slf4j
@Tag(name = "Expert Controller")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200/")
public class ExpertController {

    private final ActivityLogService activityLogService;
    private final ExpertService expertService;

    @PostMapping("/create-category")
    public ResponseData<Long> createCategory(
            @Valid @RequestBody CreateCategoryRequestDTO createCategoryRequestDTO,
            @RequestAttribute("userId") Integer expertId){
        try {
            Long categoryId = expertService.createCategoryByExpert(createCategoryRequestDTO);
            activityLogService.logActivity(expertId, "Create_Category",
                    "Expert create category " + createCategoryRequestDTO.getName());
            return new ResponseData<>(HttpStatus.CREATED.value(), "Create category successfully", categoryId);
        } catch (ResourceNotFoundException e) {
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Operation(method = "POST", summary = "Get list of categories", description = "Get paginated list of categories")
    @PostMapping("/list_category")
    public ResponseData<List<CategoryDetailResponse>> getListCategory(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        log.info("Request get list categories, pageNo: {}, pageSize: {}", pageNo, pageSize);

        try {
            List<CategoryDetailResponse> categories = expertService.getAllCategories(pageNo, pageSize);
            return new ResponseData<>(HttpStatus.OK.value(), "Get list categories successfully", categories);
        } catch (Exception e) {
            log.error("Get list categories failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get list categories failed");
        }
    }

    @Operation(method = "PUT", summary = "Update article category", description = "Update an existing article category")
    @PutMapping("/update-category/{categoryId}")
    public ResponseData<Long> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody UpdateCategoryRequestDTO updateCategoryRequestDTO,
            @RequestAttribute("userId") Integer expertId) {
        log.info("Request update category, categoryId: {}, expertId: {}", categoryId, expertId);
        
        try {
            Long updatedCategoryId = expertService.updateCategoryByExpert(categoryId, updateCategoryRequestDTO);
            activityLogService.logActivity(expertId, "Update_Category",
                    "Expert update category " + updateCategoryRequestDTO.getName() + " with id " + categoryId);
            return new ResponseData<>(HttpStatus.OK.value(), "Update category successfully", updatedCategoryId);
        } catch (ResourceNotFoundException e) {
            log.error("Category not found for update, categoryId: {}", categoryId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Update category failed, categoryId: {}", categoryId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Operation(method = "POST", summary = "Delete article category", description = "Delete an existing article category")
    @PostMapping("/delete-category/{categoryId}")
    public ResponseData<Void> deleteCategory(
            @PathVariable Long categoryId,
            @RequestAttribute("userId") Integer expertId) {
        log.info("Request delete category, categoryId: {}, expertId: {}", categoryId, expertId);
        
        try {
            expertService.deleteCategoryByExpert(categoryId);
            activityLogService.logActivity(expertId, "Delete_Category",
                    "Expert delete category with id " + categoryId);
            return new ResponseData<>(HttpStatus.OK.value(), "Delete category successfully", null);
        } catch (ResourceNotFoundException e) {
            log.error("Category not found for deletion, categoryId: {}", categoryId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Delete category failed, categoryId: {}", categoryId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Operation(method = "PATCH", summary = "Change category status", description = "Change category status (ACTIVE/INACTIVE)")
    @PatchMapping("/change-category-status/{categoryId}")
    public ResponseData<?> changeCategoryStatus(
            @PathVariable Long categoryId,
            @Valid @RequestBody ChangeCategoryStatusRequestDTO changeCategoryStatusRequestDTO,
            @RequestAttribute("userId") Integer expertId) {
        log.info("Request change category status, categoryId: {}, status: {}", categoryId, changeCategoryStatusRequestDTO.getStatus());
        
        try {
            expertService.changeCategoryStatus(categoryId, changeCategoryStatusRequestDTO.getStatus());
            activityLogService.logActivity(expertId, "Change_Category_Status",
                    "Expert change category status to " + changeCategoryStatusRequestDTO.getStatus() + " for category id " + categoryId);
            return new ResponseData<>(HttpStatus.OK.value(), "Change category status successfully", null);
        } catch (Exception e) {
            log.error("Change category status failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Change category status failed: " + e.getMessage());
        }
    }

    @Operation(method = "POST", summary = "Create article", description = "Create a new article by expert")
    @PostMapping("/create-article")
    public ResponseData<Long> createArticle(
            @Valid @RequestBody CreateArticleRequestDTO createArticleRequestDTO,
            @RequestAttribute("userId") Integer expertId) {
        try {
            Long articleId = expertService.createArticleByExpert(createArticleRequestDTO, expertId.longValue());
            activityLogService.logActivity(expertId, "Create_Article",
                    "Expert create article: " + createArticleRequestDTO.getTitle());
            return new ResponseData<>(HttpStatus.CREATED.value(), "Article created successfully", articleId);
        } catch (ResourceNotFoundException e) {
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (InvalidDataException e) {
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Operation(method = "POST", summary = "Upload article image", description = "Upload image for article")
    @PostMapping("/upload-article-image")
    public ResponseEntity<ResponseData<String>> uploadArticleImage(@RequestParam("image") MultipartFile image) {
        try {
            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File is empty", null));
            }
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File must be an image", null));
            }
            if (image.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File size must be less than 5MB", null));
            }
            String uploadDir = "uploads/articles/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = image.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(image.getInputStream(), filePath);
            String imageUrl = "/api/expert/articles/" + newFilename;
            return ResponseEntity.ok(new ResponseData<>(200, "Upload thành công", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ResponseData<>(500, "Upload thất bại: " + e.getMessage(), null));
        }
    }

    @Operation(method = "GET", summary = "Get article image", description = "Get article image by filename")
    @GetMapping("/articles/{filename}")
    public ResponseEntity<Resource> getArticleImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/articles/").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

}
