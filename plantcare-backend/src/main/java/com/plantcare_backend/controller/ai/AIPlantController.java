package com.plantcare_backend.controller.ai;

import com.plantcare_backend.annotation.VIPOnly;
import com.plantcare_backend.dto.response.ai.PlantIdentificationResponseDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.service.AIPlantService;
import com.plantcare_backend.service.impl.ai.AIPlantServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Plant Controller", description = "APIs for AI-powered plant identification")
@CrossOrigin(origins = "http://localhost:4200/")
public class AIPlantController {

    private final AIPlantService aiPlantService;

    /**
     * Nhận diện cây từ ảnh
     */
    @VIPOnly(message = "Tính năng AI nhận diện cây chỉ dành cho tài khoản VIP. Vui lòng nâng cấp tài khoản để sử dụng.")
    @Operation(summary = "Identify plant from image", description = "Use AI to identify plant species from uploaded image")
    @PostMapping("/identify-plant")
    public ResponseData<PlantIdentificationResponseDTO> identifyPlant(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "language", defaultValue = "vi") String language,
            @RequestParam(value = "maxResults", defaultValue = "5") Integer maxResults) {

        log.info("AI Plant identification request received for image: {}", image.getOriginalFilename());

        try {
            // Validate image
            if (image.isEmpty()) {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Image file is required");
            }

            if (!image.getContentType().startsWith("image/")) {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), "File must be an image");
            }

            if (image.getSize() > 20 * 1024 * 1024) { // 20MB limit
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Image size must be less than 20MB");
            }

            PlantIdentificationResponseDTO result = aiPlantService.identifyPlant(image, language, maxResults);

            if ("SUCCESS".equals(result.getStatus())) {
                return new ResponseData<>(HttpStatus.OK.value(), "Plant identification completed successfully", result);
            } else {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), result.getMessage());
            }

        } catch (Exception e) {
            log.error("Error during plant identification", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Plant identification failed: " + e.getMessage());
        }
    }

    /**
     * Validate xem ảnh có phải là thực vật không
     */
    @Operation(summary = "Validate plant image", description = "Check if uploaded image contains a plant")
    @PostMapping("/validate-plant-image")
    public ResponseData<Boolean> validatePlantImage(@RequestParam("image") MultipartFile image) {

        log.info("Plant image validation request received for image: {}", image.getOriginalFilename());

        try {
            if (image.isEmpty()) {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Image file is required");
            }

            Boolean isValid = aiPlantService.validatePlantImage(image);

            return new ResponseData<>(HttpStatus.OK.value(),
                    isValid ? "Image contains a plant" : "Image does not contain a plant",
                    isValid);

        } catch (Exception e) {
            log.error("Error during plant image validation", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Plant image validation failed: " + e.getMessage());
        }
    }

        /**
     * Tìm kiếm cây trong database
     */
    @Operation(summary = "Search plants in database", description = "Search for plants in database by name")
    @GetMapping("/search-plants")
    public ResponseData<PlantIdentificationResponseDTO> searchPlantsInDatabase(
            @RequestParam("plantName") String plantName) {
        
        log.info("Database plant search request received for: {}", plantName);
        
        try {
            if (plantName == null || plantName.trim().isEmpty()) {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Plant name is required");
            }
            
            PlantIdentificationResponseDTO result = aiPlantService.searchPlantsInDatabase(plantName.trim());
            
            if ("SUCCESS".equals(result.getStatus())) {
                return new ResponseData<>(HttpStatus.OK.value(), "Plant search completed successfully", result);
            } else {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), result.getMessage());
            }
            
        } catch (Exception e) {
            log.error("Error during plant search", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), 
                    "Plant search failed: " + e.getMessage());
        }
    }

    /**
     * Test API key
     */
    @Operation(summary = "Test API key", description = "Test Plant.id API key configuration")
    @GetMapping("/test-api-key")
    public ResponseData<String> testApiKey() {
        log.info("Testing API key configuration");
        
        try {
            // Cast to implementation để gọi test method
            if (aiPlantService instanceof AIPlantServiceImpl) {
                ((AIPlantServiceImpl) aiPlantService).testApiKey();
                return new ResponseData<>(HttpStatus.OK.value(), "API key test completed", "Check logs for details");
            } else {
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Service implementation not found");
            }
        } catch (Exception e) {
            log.error("Error testing API key", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), 
                    "API key test failed: " + e.getMessage());
        }
    }
}