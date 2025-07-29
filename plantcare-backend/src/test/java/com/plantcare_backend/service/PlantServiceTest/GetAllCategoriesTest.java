package com.plantcare_backend.service.PlantServiceTest;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.service.PlantService;
import com.plantcare_backend.service.impl.PlantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlantCategoryServiceTest {

    @Mock
    private PlantCategoryRepository categoryRepository;

    @InjectMocks
    private PlantServiceImpl plantCategoryService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Test
    void testGetAllCategories() throws JsonProcessingException {
        // Arrange
        PlantCategory cat1 = new PlantCategory(1L, "Cây trong nhà", "Mô tả cây trong nhà", Timestamp.valueOf("2025-07-29 21:30:00"));
        PlantCategory cat2 = new PlantCategory(2L, "Cây ngoài trời", "Mô tả cây ngoài trời", Timestamp.valueOf("2025-07-29 21:30:00"));

        List<PlantCategory> mockCategories = Arrays.asList(cat1, cat2);
        when(categoryRepository.findAll()).thenReturn(mockCategories);

        // Act
        List<PlantCategory> result = plantCategoryService.getAllCategories();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Cây trong nhà", result.get(0).getName());

        // In kết quả (cho dễ debug hoặc log ra file test)
        String jsonResult = objectMapper.writeValueAsString(result);
        System.out.println("Kết quả getAllCategories():\n" + jsonResult);

        // Verify repository được gọi đúng 1 lần
        verify(categoryRepository, times(1)).findAll();
    }
    @Test
    void testGetAllCategories_WhenNoCategoriesInDB_ReturnsEmptyList() throws JsonProcessingException {
        // Arrange: giả lập repository trả về danh sách rỗng
        when(categoryRepository.findAll()).thenReturn(List.of());

        // Act
        List<PlantCategory> result = plantCategoryService.getAllCategories();

        // Assert
        assertNotNull(result, "Kết quả không được null");
        assertTrue(result.isEmpty(), "Danh sách trả về phải rỗng");

        // In kết quả (nếu cần log)
        String jsonResult = objectMapper.writeValueAsString(result);
        System.out.println("Kết quả khi DB không có category:\n" + jsonResult);

        // Verify repository được gọi đúng 1 lần
        verify(categoryRepository, times(1)).findAll();
    }

}
