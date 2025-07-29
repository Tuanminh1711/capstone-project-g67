package com.plantcare_backend.dto.request.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlantIdentificationRequestDTO {
    private MultipartFile image;
    private String language = "vi"; // Ngôn ngữ kết quả trả về
    private Integer maxResults = 5; // Số lượng kết quả tối đa
} 