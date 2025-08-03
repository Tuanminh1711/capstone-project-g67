package com.plantcare_backend.dto.request.userPlants;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.List;

@Data
public class AddUserPlantRequestDTO {
    private Long plantId;
    private String nickname;
    private Timestamp plantingDate;
    private String locationInHouse;
    private boolean reminderEnabled;
    private List<MultipartFile> images; // Thêm field images
}
