package com.plantcare_backend.service.IpLocationServiceTest;

import com.plantcare_backend.service.impl.IpLocationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GetLocationFromIpTest {
    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private IpLocationServiceImpl ipLocationService;

    Map<String, Object> mockResponse;

    String ipV4 = "127.0.0.1";
    String ipV6 = "0:0:0:0:0:0:0:1";

    @BeforeEach
    void setUp() {
        mockResponse = new HashMap<>();
        mockResponse.put("status", "success");
        mockResponse.put("city", "Hanoi");
        mockResponse.put("regionName", "Hanoi");
        mockResponse.put("country", "Vietnam");
    }

    @Test
    void testGetLocationFromIp_localhostIpv4_success() {
        try {
            String result = ipLocationService.getLocationFromIp("127.0.0.1");
            assertEquals("Localhost", result);
            System.out.println("Test 'testGetLocationFromIp_localhostIpv4_success' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_localhostIpv4_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_localhostIpv6_success() {
        try {
            String result = ipLocationService.getLocationFromIp("0:0:0:0:0:0:0:1");
            assertEquals("Localhost", result);
            System.out.println("Test 'testGetLocationFromIp_localhostIpv6_success' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_localhostIpv6_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_nullIp_success() {
        try {
            String result = ipLocationService.getLocationFromIp(null);
            assertEquals("Localhost", result);

            System.out.println("Test 'testGetLocationFromIp_nullIp_success' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_nullIp_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_ValidResponse() {
        ipV4 = "8.8.8.8";
        String expectedUrl = "http://ip-api.com/json/" + ipV4 + "?fields=status,country,regionName,city,message";
        try {

            when(restTemplate.getForObject(eq(expectedUrl), eq(Map.class)))
                    .thenReturn(mockResponse);

            String result = ipLocationService.getLocationFromIp(ipV4);
            assertEquals("Hanoi, Hanoi, Vietnam", result);

            System.out.println("Test 'testGetLocationFromIp_nullIp_success' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_nullIp_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_ApiFailedStatus() {
        ipV4 = "8.8.4.4";
        mockResponse.put("status", "fail");
        mockResponse.put("message", "invalid query");
        String expectedUrl = "http://ip-api.com/json/" + ipV4 + "?fields=status,country,regionName,city,message";
        try {
            when(restTemplate.getForObject(eq(expectedUrl), eq(Map.class)))
                    .thenReturn(mockResponse);

            String result = ipLocationService.getLocationFromIp(ipV4);
            assertEquals("Unknown", result);

            System.out.println("Test 'testGetLocationFromIp_ApiFailedStatus' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_ApiFailedStatus' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_NullResponse() {
        ipV4 = "1.1.1.1";
        String expectedUrl = "http://ip-api.com/json/" + ipV4 + "?fields=status,country,regionName,city,message";
        try {
            when(restTemplate.getForObject(eq(expectedUrl), eq(Map.class)))
                    .thenReturn(null);

            String result = ipLocationService.getLocationFromIp(ipV4);
            assertEquals("Unknown", result);

            System.out.println("Test 'testGetLocationFromIp_NullResponse' thành công");
            System.out.println("Location: " + result);
//            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_NullResponse' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_RestClientException() {
        String expectedUrl = "http://ip-api.com/json/" + ipV4 + "?fields=status,country,regionName,city,message";
        try {
            when(restTemplate.getForObject(eq(expectedUrl), eq(Map.class)))
                    .thenThrow(new RestClientException("Connection error"));

            String result = ipLocationService.getLocationFromIp(ipV4);
            assertEquals("Unknown", result);

            System.out.println("Test 'testGetLocationFromIp_RestClientException' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_RestClientException' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_InvalidFormat() {
        try {
            ipV6 = "999.999.999.999";
            String expectedUrl = "http://ip-api.com/json/" + ipV6 + "?fields=status,country,regionName,city,message";

            Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("status", "fail");
            mockResponse.put("message", "invalid query");

            when(restTemplate.getForObject(eq(expectedUrl), eq(Map.class)))
                    .thenReturn(mockResponse);

            String result = ipLocationService.getLocationFromIp(ipV6);
            assertEquals("Unknown", result);

            System.out.println("Test 'testGetLocationFromIp_InvalidFormat' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_InvalidFormat' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGetLocationFromIp_NonIpString() {
        try {
            String invalidIp = "not-an-ip";
            String expectedUrl = "http://ip-api.com/json/" + invalidIp + "?fields=status,country,regionName,city,message";

            Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("status", "fail");
            mockResponse.put("message", "invalid query");

            when(restTemplate.getForObject(eq(expectedUrl), eq(Map.class)))
                    .thenReturn(mockResponse);

            String result = ipLocationService.getLocationFromIp(invalidIp);
            assertEquals("Unknown", result);

            System.out.println("Test 'testGetLocationFromIp_NonIpString' thành công");
            System.out.println("Location: " + result);
        } catch (Exception e) {
            System.out.println("Test 'testGetLocationFromIp_NonIpString' thất bại: " + e.getMessage());
        }
    }

}
