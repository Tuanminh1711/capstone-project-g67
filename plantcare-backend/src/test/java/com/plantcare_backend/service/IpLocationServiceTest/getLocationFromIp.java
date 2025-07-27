package com.plantcare_backend.service.IpLocationServiceTest;

import com.plantcare_backend.service.impl.IpLocationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
public class getLocationFromIp {
    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private IpLocationServiceImpl ipLocationService;

    @Test
    void testGetLocationFromIp_LocalhostIpv4() {
        String result = ipLocationService.getLocationFromIp("127.0.0.1");
        assertEquals("Localhost", result);
    }
}
