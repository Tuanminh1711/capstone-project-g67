package com.plantcare_backend.controller.plant;

import com.plantcare_backend.dto.request.plants.PlantSearchRequestDTO;
import com.plantcare_backend.dto.response.Plants.PlantSearchResponseDTO;
import com.plantcare_backend.dto.response.Plants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.service.PlantService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.http.MediaType;

import java.util.Collections;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.any;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;


@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
public class PlantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PlantService plantService;

    PlantSearchResponseDTO responseDTO = new PlantSearchResponseDTO();
    PlantDetailResponseDTO fullDto = new PlantDetailResponseDTO();
    UserPlantDetailResponseDTO userDto = new UserPlantDetailResponseDTO();

    @Test
    void searchPlants_success() throws Exception {
        given(plantService.searchPlants(any(PlantSearchRequestDTO.class))).willReturn(responseDTO);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/plants/search")
                        .param("keyword", "test")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Search plants successfully"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/plants/search")
                        .param("keyword", "test")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print());
    }

    @Test
    void getAllCategories_success() throws Exception {
        List<PlantCategory> categories = Collections.emptyList();
        given(plantService.getAllCategories()).willReturn(categories);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/plants/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Get categories successfully"));


        mockMvc.perform(MockMvcRequestBuilders.get("/api/plants/categories"))
                .andDo(print());
    }

    @Test
    void getPlantDetailForUser_success() throws Exception {
        Long plantId = 1L;
        fullDto.setStatus("ACTIVE");
        given(plantService.getPlantDetail(plantId)).willReturn(fullDto);
        given(plantService.toUserPlantDetailDTO(fullDto)).willReturn(userDto);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/plants/detail/" + 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Get plant detail successfully"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/plants/detail/" + 1L))
                .andDo(print());
    }
}
