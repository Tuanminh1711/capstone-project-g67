package com.plantcare_backend.service;

import com.plantcare_backend.dto.response.ai_disease.PlantIdResponse;
import org.springframework.web.multipart.MultipartFile;

public interface PlantIdService {
    PlantIdResponse analyzePlantDisease(MultipartFile image);
}
