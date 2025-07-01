package com.plantcare_backend.dto.request.plantsManager;

import lombok.Data;

@Data
public class LockUnlockPlantRequestDTO {
    private Long plantId;
    private boolean lock;
}
