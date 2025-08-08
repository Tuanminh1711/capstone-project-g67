package com.plantcare_backend.service.vip;

import com.plantcare_backend.model.Users;

public interface VIPUsageService {
    void trackUsage(Users user, String feature, boolean success);
    boolean checkUsageLimit(Users user, String feature);
}
