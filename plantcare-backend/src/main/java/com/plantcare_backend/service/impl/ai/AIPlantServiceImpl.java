package com.plantcare_backend.service.impl.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantcare_backend.dto.response.ai.PlantIdentificationResponseDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.AIPlantService;
import com.plantcare_backend.service.vip.VIPUsageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;
import java.util.HashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIPlantServiceImpl implements AIPlantService {

    private final PlantRepository plantRepository;
    private final UserRepository userRepository; // Thêm dependency này
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final VIPUsageService vipUsageService;

    @Value("${plantcare.ai.plant-id.api-key:sgG4eDNnSC87ATYjZllplm8ktLG54LAhai1QCbY13nla1x4fap}")
    private String plantIdApiKey;

    @Value("${plantcare.ai.plant-id.base-url:https://plant.id/api/v3}")
    private String plantIdBaseUrl;

    @Override
    public PlantIdentificationResponseDTO identifyPlant(MultipartFile image, String language, Integer maxResults) {
        Long userId = getCurrentUserId();
        Users user = userRepository.findById(Math.toIntExact(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean success = false;
        try {
            log.info("Starting plant identification for user: {} (ID: {})", user.getUsername(), userId);

            if (!validatePlantImage(image)) {
                vipUsageService.trackUsage(user, "AI_PLANT_IDENTIFICATION", false);
                return PlantIdentificationResponseDTO.builder()
                        .status("ERROR")
                        .message("Image does not contain a plant")
                        .results(Collections.emptyList())
                        .build();
            }

            List<PlantIdentificationResponseDTO.PlantResult> aiResults = callPlantIdAPI(image, language, maxResults);

            List<PlantIdentificationResponseDTO.PlantResult> matchedResults = matchWithDatabase(aiResults);

            PlantIdentificationResponseDTO result = PlantIdentificationResponseDTO.builder()
                    .requestId(UUID.randomUUID().toString())
                    .status("SUCCESS")
                    .message("Plant identification completed")
                    .results(matchedResults)
                    .build();

            success = true;
            vipUsageService.trackUsage(user, "AI_PLANT_IDENTIFICATION", true);
            return result;

        } catch (Exception e) {
            log.error("Error during plant identification for user: {}", user.getUsername(), e);
            vipUsageService.trackUsage(user, "AI_PLANT_IDENTIFICATION", false);
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
            return true;
        } catch (Exception e) {
            log.error("Error validating plant image", e);
            return false;
        }
    }

    public void testApiKey() {
        try {
            log.info("Testing Plant.id API key: {}", plantIdApiKey.substring(0, 10) + "...");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

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
        Long userId = getCurrentUserId();
        Users user = userRepository.findById(Math.toIntExact(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean success = false;
        try {
            log.info("Searching plants in database for user: {} (ID: {}), plantName: {}",
                    user.getUsername(), userId, plantName);

            List<Plants> plants = plantRepository
                    .findByScientificNameContainingIgnoreCaseOrCommonNameContainingIgnoreCase(
                            plantName, plantName);

            List<PlantIdentificationResponseDTO.PlantResult> results = plants.stream()
                    .map(this::convertToPlantResult)
                    .collect(Collectors.toList());

            PlantIdentificationResponseDTO result = PlantIdentificationResponseDTO.builder()
                    .requestId(UUID.randomUUID().toString())
                    .status("SUCCESS")
                    .message("Found " + results.size() + " plants in database")
                    .results(results)
                    .build();

            success = true;
            vipUsageService.trackUsage(user, "AI_PLANT_SEARCH", true);
            return result;

        } catch (Exception e) {
            log.error("Error searching plants in database for user: {}", user.getUsername(), e);
            vipUsageService.trackUsage(user, "AI_PLANT_SEARCH", false);
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
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("images", new org.springframework.core.io.ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            });
            body.add("api_key", plantIdApiKey);
            body.add("organs", "leaf");
            body.add("include_related_images", "false");
            body.add("language", language);
            body.add("details",
                    "common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,similar_images");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    plantIdBaseUrl + "/identify",
                    HttpMethod.POST,
                    requestEntity,
                    String.class);
            log.info("Plant.id API Response: {}", response.getBody());

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
            log.info("Trying to match AI result: {}", aiResult.getScientificName());

            Optional<Plants> exactMatch = plantRepository.findByScientificNameIgnoreCase(aiResult.getScientificName());

            if (exactMatch.isPresent()) {
                log.info("✅ Exact match found in database: {}", exactMatch.get().getScientificName());

                Plants plant = exactMatch.get();
                PlantIdentificationResponseDTO.PlantResult matchedResult = convertToPlantResult(plant);
                matchedResult.setConfidence(aiResult.getConfidence());
                matchedResult.setIsExactMatch(true);
                matchedResults.add(matchedResult);
            } else {
                log.info("❌ No exact match found for: {}", aiResult.getScientificName());

                List<Plants> partialMatches = plantRepository.findByScientificNameContainingIgnoreCaseOrCommonNameContainingIgnoreCase(
                        aiResult.getScientificName(), aiResult.getScientificName());

                if (!partialMatches.isEmpty()) {
                    log.info("✅ Partial match found: {}", partialMatches.get(0).getScientificName());

                    Plants bestMatch = partialMatches.get(0);
                    PlantIdentificationResponseDTO.PlantResult matchedResult = convertToPlantResult(bestMatch);
                    matchedResult.setConfidence(aiResult.getConfidence() * 0.8);
                    matchedResult.setIsExactMatch(false);
                    matchedResults.add(matchedResult);
                } else {
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
                .vietnameseName(plant.getCommonName())
                .confidence(1.0)
                .description(plant.getDescription())
                .careInstructions(plant.getCareInstructions())
                .plantId(plant.getId())
                .isExactMatch(true)
                .build();
    }

    /**
     * Lấy user ID từ SecurityContext
     */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        String username = principal.toString();
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return (long) user.getId();
    }
}