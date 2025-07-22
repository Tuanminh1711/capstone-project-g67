package com.plantcare_backend.controller.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO;
import com.plantcare_backend.dto.request.userPlants.CreateUserPlantRequestDTO;
import com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.service.UserPlantsService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.sql.Timestamp;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
public class UserPlantsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserPlantsService userPlantsService;

    @Autowired
    private ObjectMapper objectMapper;

    private AddUserPlantRequestDTO addUserPlantRequest;
    private Timestamp date;
    private String token;
    private CreateUserPlantRequestDTO createUserPlantRequest;
    private UpdateUserPlantRequestDTO updateUserPlantRequest;

    @BeforeEach
    void initData() throws Exception {

        date = Timestamp.valueOf(LocalDate.of(2021, 1, 1).atStartOfDay());

        addUserPlantRequest = AddUserPlantRequestDTO.builder()
                .plantId(1L)
                .nickname("My First Plant")
                .plantingDate(date)
                .locationInHouse("Bedroom")
                .reminderEnabled(true)
                .build();

        createUserPlantRequest = CreateUserPlantRequestDTO.builder()
            .scientificName("Ficus lyrata")
            .commonName("Fiddle Leaf Fig")
            .categoryId("1")
            .description("A beautiful indoor plant with large leaves.")
            .careInstructions("Water weekly. Bright, indirect light.")
            .lightRequirement(Plants.LightRequirement.MEDIUM)
            .waterRequirement(Plants.WaterRequirement.MEDIUM)
            .careDifficulty(Plants.CareDifficulty.EASY)
            .suitableLocation("Living Room")
            .commonDiseases("Root rot")
            .imageUrls(java.util.Collections.singletonList("http://example.com/image1.jpg"))
            .build();

        updateUserPlantRequest = UpdateUserPlantRequestDTO.builder()
                .userPlantId(1L)
                .nickname("Updated Plant")
                .plantingDate(date)
                .locationInHouse("Living room")
                .reminderEnabled(true)
                .build();

        // Get token
        String loginRequest = "{\"username\":\"minh\",\"password\":\"tuanminhlz\"}";
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequest))
                .andDo(print())
                .andExpect(status().isOk())
                .andDo(result -> {
                    String response = result.getResponse().getContentAsString();
                    token = objectMapper.readTree(response).get("token").asText();
                });
    }

    @Test
    void addUserPlant_success() throws Exception {
        //given
        String content = objectMapper.writeValueAsString(addUserPlantRequest);

        //when
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/user-plants/add")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Plant added to user collection successfully"));

        //then
        mockMvc.perform(post("/api/user-plants/add")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andDo(print());
    }

    @Test
    void searchUserPlants_success() throws Exception {

        mockMvc.perform(MockMvcRequestBuilders.post("/api/user-plants/search")
                        .header("Authorization", "Bearer " + token)
                        .param("keywordOfCommonName", "Fern")
                        .param("pageNo", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Search user plants successfully"));

        mockMvc.perform(post("/api/user-plants/search")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("pageNo", "0")
                        .param("pageSize", "10"))
                .andDo(print());
    }

    @Test
    void getAllUserPlants_success() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user-plants/get-all-user-plants")
                        .header("Authorization", "Bearer " + token)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Get user plants successfully"));

        mockMvc.perform(get("/api/user-plants/get-all-user-plants")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("pageNo", "0")
                        .param("pageSize", "10"))
                .andDo(print());
    }

    @Test
    void getUserPlantDetail_success() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user-plants/user-plant-detail/{id}", 1)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Get plant detail successfully"));

        mockMvc.perform(get("/api/user-plants/user-plant-detail/{id}", 1)
                .header("Authorization", "Bearer " + token))
                .andDo(print());
    }

    @Test
    void deleteUserPlant_success() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/user-plants/delete/{userPlantId}", 1)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User plant deleted successfully"));

        mockMvc.perform(delete("/api/user-plants/delete/{userPlantId}", 1)
                        .header("Authorization", "Bearer " + token))
                .andDo(print());
    }

    @Test
    void updateUserPlant_success() throws Exception {
        String content = objectMapper.writeValueAsString(updateUserPlantRequest);

        mockMvc.perform(MockMvcRequestBuilders.put("/api/user-plants/update")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User plant updated successfully"));

        mockMvc.perform(put("/api/user-plants/update")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andDo(print());

    }

    @Test
    void createNewPlant_success() throws Exception {
        String createRequest = objectMapper.writeValueAsString(createUserPlantRequest);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/user-plants/create-new-plant")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Plant created and added to collection successfully"));

        mockMvc.perform(post("/api/user-plants/create-new-plant")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequest))
                .andDo(print());
    }
}
