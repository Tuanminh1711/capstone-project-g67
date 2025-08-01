package com.plantcare_backend.service.plantServiceTest;

import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.service.impl.PlantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetAllCategoriesTest {

    @Mock
    private PlantCategoryRepository categoryRepository;

    @InjectMocks
    private PlantServiceImpl plantService;

    @BeforeEach
    void setUp() {
        // Nothing needed here for now
    }

    @Test
    void getAllCategories_shouldReturnList() {
        PlantCategory cat1 = new PlantCategory(1L, "Indoor", "Bullshit", Timestamp.from(java.time.Instant.now()));
        PlantCategory cat2 = new PlantCategory(2L, "Outdoor", "Bullshit", Timestamp.from(java.time.Instant.now()));

        List<PlantCategory> mockCategories = Arrays.asList(cat1, cat2);

        when(categoryRepository.findAll()).thenReturn(mockCategories);

        List<PlantCategory> result = plantService.getAllCategories();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Indoor", result.get(0).getName());
        assertEquals("Outdoor", result.get(1).getName());

        System.out.println("✅ getAllCategories_shouldReturnList: PASSED");
    }

    @Test
    void getAllCategories_shouldReturnEmptyListIfNoData() {
        when(categoryRepository.findAll()).thenReturn(Collections.emptyList());

        List<PlantCategory> result = plantService.getAllCategories();

        assertNotNull(result);
        assertTrue(result.isEmpty());

        System.out.println("✅ getAllCategories_shouldReturnEmptyListIfNoData: PASSED");
    }
}
