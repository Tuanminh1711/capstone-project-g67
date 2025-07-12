package com.plantcare_backend.service.impl;

import com.plantcare_backend.service.IpLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class IpLocationServiceImpl implements IpLocationService {
    @Autowired
    private final RestTemplate restTemplate;

    @Override
    public String getLocationFromIp(String ipAddress) {
        if (ipAddress == null || ipAddress.equals("127.0.0.1") || ipAddress.equals("0:0:0:0:0:0:0:1")) {
            return "Localhost";
        }
        String url = "http://ip-api.com/json/" + ipAddress + "?fields=status,country,regionName,city,message";
        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) return "Unknown";
            if ("success".equals(response.get("status"))) {
                return response.get("city") + ", " + response.get("regionName") + ", " + response.get("country");
            } else {
                return "Unknown";
            }
        } catch (RestClientException e) {
            return "Unknown";
        }
    }
}
