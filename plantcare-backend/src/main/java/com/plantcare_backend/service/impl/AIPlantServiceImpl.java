package com.plantcare_backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantcare_backend.dto.response.ai.PlantIdentificationResponseDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.AIPlantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.HashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIPlantServiceImpl implements AIPlantService {

    private final PlantRepository plantRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${plantcare.ai.plant-id.api-key}")
    private String plantIdApiKey;

    @Value("${plantcare.ai.plant-id.base-url:https://api.plant.id/v2}")
    private String plantIdBaseUrl;

    @Override
    public PlantIdentificationResponseDTO identifyPlant(MultipartFile image, String language, Integer maxResults) {
        try {
            log.info("Starting plant identification for image: {}", image.getOriginalFilename());

            // 1. Validate image
            if (!validatePlantImage(image)) {
                return PlantIdentificationResponseDTO.builder()
                        .status("ERROR")
                        .message("Image does not contain a plant")
                        .results(Collections.emptyList())
                        .build();
            }

            // 2. Call Plant.id API
            List<PlantIdentificationResponseDTO.PlantResult> aiResults = callPlantIdAPI(image, language, maxResults);

            // 3. Match with database
            List<PlantIdentificationResponseDTO.PlantResult> matchedResults = matchWithDatabase(aiResults);

            return PlantIdentificationResponseDTO.builder()
                    .requestId(UUID.randomUUID().toString())
                    .status("SUCCESS")
                    .message("Plant identification completed")
                    .results(matchedResults)
                    .build();

        } catch (Exception e) {
            log.error("Error during plant identification", e);
            return PlantIdentificationResponseDTO.builder()
                    .status("ERROR")
                    .message("Plant identification failed: " + e.getMessage())
                    .results(Collections.emptyList())
                    .build();
        }
    }

    @Override
    public Boolean validatePlantImage(MultipartFile image) {
        try {
            // Gọi API để kiểm tra xem ảnh có chứa thực vật không
            // Có thể sử dụng Google Vision API hoặc Plant.id API
            return true; // Tạm thời return true, sẽ implement sau
        } catch (Exception e) {
            log.error("Error validating plant image", e);
            return false;
        }
    }

    // Debug method để test API key
    public void testApiKey() {
        try {
            log.info("Testing Plant.id API key: {}", plantIdApiKey.substring(0, 10) + "...");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Test với một request đơn giản
            Map<String, Object> testBody = new HashMap<>();
            testBody.put("api_key", plantIdApiKey);
            testBody.put("images",
                    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=");
            testBody.put("organs", "leaf");

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(testBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    plantIdBaseUrl + "/identify",
                    HttpMethod.POST,
                    requestEntity,
                    String.class);

            log.info("API test successful: {}", response.getStatusCode());

        } catch (Exception e) {
            log.error("API test failed: {}", e.getMessage());
        }
    }

    @Override
    public PlantIdentificationResponseDTO searchPlantsInDatabase(String plantName) {
        try {
            log.info("Searching plants in database for: {}", plantName);

            List<Plants> plants = plantRepository
                    .findByScientificNameContainingIgnoreCaseOrCommonNameContainingIgnoreCase(
                            plantName, plantName);

            List<PlantIdentificationResponseDTO.PlantResult> results = plants.stream()
                    .map(this::convertToPlantResult)
                    .collect(Collectors.toList());

            return PlantIdentificationResponseDTO.builder()
                    .requestId(UUID.randomUUID().toString())
                    .status("SUCCESS")
                    .message("Found " + results.size() + " plants in database")
                    .results(results)
                    .build();

        } catch (Exception e) {
            log.error("Error searching plants in database", e);
            return PlantIdentificationResponseDTO.builder()
                    .status("ERROR")
                    .message("Database search failed: " + e.getMessage())
                    .results(Collections.emptyList())
                    .build();
        }
    }

    private List<PlantIdentificationResponseDTO.PlantResult> callPlantIdAPI(MultipartFile image, String language,
                                                                            Integer maxResults) {
        try {
            // 1. Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // 2. Prepare request body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("images", new org.springframework.core.io.ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            });
            body.add("api_key", plantIdApiKey); // Add API key to body
            body.add("organs", "leaf"); // Focus on leaf identification
            body.add("include_related_images", "false");
            body.add("language", language);
            body.add("details",
                    "common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,similar_images");

            // 3. Make API call
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    plantIdBaseUrl + "/identify",
                    HttpMethod.POST,
                    requestEntity,
                    String.class);
            log.info("Plant.id API Response: {}", response.getBody());

            // 4. Parse response
            return parsePlantIdResponse(response.getBody(), maxResults);

        } catch (Exception e) {
            log.error("Error calling Plant.id API", e);
            return Collections.emptyList();
        }
    }

    private List<PlantIdentificationResponseDTO.PlantResult> parsePlantIdResponse(String responseBody, Integer maxResults) {
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            List<PlantIdentificationResponseDTO.PlantResult> results = new ArrayList<>();

            // Sửa từ "result.classification" thành "suggestions"
            if (rootNode.has("suggestions")) {
                JsonNode suggestions = rootNode.get("suggestions");

                int count = 0;
                for (JsonNode suggestion : suggestions) {
                    if (count >= maxResults) break;

                    PlantIdentificationResponseDTO.PlantResult result = PlantIdentificationResponseDTO.PlantResult.builder()
                            .scientificName(suggestion.path("plant_name").asText())
                            .commonName("") // Có thể lấy từ plant_details
                            .vietnameseName("") // Có thể lấy từ plant_details
                            .confidence(suggestion.path("probability").asDouble())
                            .description("") // Có thể lấy từ plant_details
                            .isExactMatch(false)
                            .build();

                    results.add(result);
                    count++;
                }
            }

            return results;

        } catch (Exception e) {
            log.error("Error parsing Plant.id API response", e);
            return Collections.emptyList();
        }
    }

    private List<PlantIdentificationResponseDTO.PlantResult> matchWithDatabase(List<PlantIdentificationResponseDTO.PlantResult> aiResults) {
        List<PlantIdentificationResponseDTO.PlantResult> matchedResults = new ArrayList<>();

        for (PlantIdentificationResponseDTO.PlantResult aiResult : aiResults) {
            // Thêm logging này
            log.info(" Trying to match AI result: {}", aiResult.getScientificName());

            // Tìm kiếm trong database theo tên khoa học
            Optional<Plants> exactMatch = plantRepository.findByScientificNameIgnoreCase(aiResult.getScientificName());

            if (exactMatch.isPresent()) {
                // Thêm logging này
                log.info("✅ Exact match found in database: {}", exactMatch.get().getScientificName());

                Plants plant = exactMatch.get();
                PlantIdentificationResponseDTO.PlantResult matchedResult = convertToPlantResult(plant);
                matchedResult.setConfidence(aiResult.getConfidence());
                matchedResult.setIsExactMatch(true);
                matchedResults.add(matchedResult);
            } else {
                // Thêm logging này
                log.info("❌ No exact match found for: {}", aiResult.getScientificName());

                // Tìm kiếm partial match
                List<Plants> partialMatches = plantRepository.findByScientificNameContainingIgnoreCaseOrCommonNameContainingIgnoreCase(
                        aiResult.getScientificName(), aiResult.getScientificName());

                if (!partialMatches.isEmpty()) {
                    // Thêm logging này
                    log.info("✅ Partial match found: {}", partialMatches.get(0).getScientificName());

                    Plants bestMatch = partialMatches.get(0);
                    PlantIdentificationResponseDTO.PlantResult matchedResult = convertToPlantResult(bestMatch);
                    matchedResult.setConfidence(aiResult.getConfidence() * 0.8);
                    matchedResult.setIsExactMatch(false);
                    matchedResults.add(matchedResult);
                } else {
                    // Thêm logging này
                    log.info("❌ No partial match found, keeping AI result");
                    matchedResults.add(aiResult);
                }
            }
        }

        return matchedResults;
    }

    private PlantIdentificationResponseDTO.PlantResult convertToPlantResult(Plants plant) {
        return PlantIdentificationResponseDTO.PlantResult.builder()
                .scientificName(plant.getScientificName())
                .commonName(plant.getCommonName())
                .vietnameseName(plant.getCommonName()) // Tạm thời dùng common name
                .confidence(1.0) // Exact match từ database
                .description(plant.getDescription())
                .careInstructions(plant.getCareInstructions())
                .plantId(plant.getId())
                .isExactMatch(true)
                .build();
    }
}