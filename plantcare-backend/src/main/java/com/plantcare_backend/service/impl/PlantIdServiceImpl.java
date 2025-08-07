package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.response.ai_disease.PlantIdResponse;
import com.plantcare_backend.service.PlantIdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlantIdServiceImpl implements PlantIdService {

    private final RestTemplate restTemplate;

    @Value("${plantcare.ai.plant-id.api-key}")
    private String apiKey;

    @Value("${plantcare.ai.plant-id.base-url}")
    private String baseUrl;

    @Override
    public PlantIdResponse analyzePlantDisease(MultipartFile image) {
        try {
            log.info("Calling Plant.id API for disease detection");

            // Chuẩn bị headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Api-Key", apiKey);

            // Chuẩn bị body với image
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("images", new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            });

            // Thêm parameters cho disease detection
            body.add("organs", "leaf");
            body.add("diseases", "all");
            body.add("health", "all");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Gọi API
            ResponseEntity<PlantIdResponse> response = restTemplate.exchange(
                    baseUrl + "/identify",
                    HttpMethod.POST,
                    requestEntity,
                    PlantIdResponse.class
            );

            log.info("Plant.id API response received successfully");
            return response.getBody();

        } catch (IOException e) {
            log.error("Error reading image file", e);
            throw new RuntimeException("Error processing image file", e);
        } catch (Exception e) {
            log.error("Error calling Plant.id API", e);
            throw new RuntimeException("Error calling Plant.id API", e);
        }
    }
}