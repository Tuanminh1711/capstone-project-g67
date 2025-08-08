package com.plantcare_backend.service.impl;

import com.plantcare_backend.model.Users;
import com.plantcare_backend.service.vip.VIPUsageService;
import org.springframework.stereotype.Service;

@Service
public class VIPUsageServiceImpl implements VIPUsageService {
    @Override
    public void trackUsage(Users user, String feature, boolean success) {
    }

    @Override
    public boolean checkUsageLimit(Users user, String feature) {
        return true;
    }
}
