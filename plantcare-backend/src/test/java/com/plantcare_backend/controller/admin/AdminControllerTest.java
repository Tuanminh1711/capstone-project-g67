package com.plantcare_backend.controller.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantcare_backend.dto.request.auth.UserRequestDTO;
import com.plantcare_backend.dto.request.admin.ChangeUserStatusRequestDTO;
import com.plantcare_backend.dto.request.admin.SearchAccountRequestDTO;
import com.plantcare_backend.dto.response.auth.UserDetailResponse;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.service.AdminService;
import com.plantcare_backend.util.Gender;
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

import java.util.Collections;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserRequestDTO request;

    @BeforeEach
    void initData(){

        request = UserRequestDTO.builder()
                .username("dungna123")
                .email("nguyentahoang15012003@gmail.com")
                .password("123456a@")
                .roleId(3)
                .phoneNumber("0123456789")
                .gender(Gender.MALE)
                .fullName("Nguyễn Tạ Hoàng")
                .build();

    }

    @Test
    void addUser_success() throws Exception {
        //given
        String content = objectMapper.writeValueAsString(request);
        given(adminService.saveUser(any(UserRequestDTO.class))).willReturn(1L);

        //when
        mockMvc.perform(MockMvcRequestBuilders
                .post("/api/admin/adduser")
                .contentType(MediaType.APPLICATION_JSON)
                .content(content))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User added successfully"));

        //then
        mockMvc.perform(post("/api/admin/adduser")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andDo(print());
    }

    @Test
    void getListAccount_success() throws Exception {
        given(adminService.getAllUsers(0, 10)).willReturn(Collections.emptyList());
        mockMvc.perform(MockMvcRequestBuilders
                .post("/api/admin/listaccount")
                .param("pageNo", "0")
                .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Get list users successfully"));
        mockMvc.perform(post("/api/admin/listaccount")
                        .param("pageNo", "0")
                        .param("pageSize", "10"))
                .andDo(print());
    }

    @Test
    void deleteUser_success() throws Exception {
        int userId = 1;
        mockMvc.perform(MockMvcRequestBuilders
                .post("/api/admin/deleteuser")
                .param("userId", String.valueOf(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deleted successfully"));
        mockMvc.perform(post("/api/admin/deleteuser")
                        .param("userId", String.valueOf(userId)))
                .andDo(print());
    }

    @Test
    void changeUserStatus_success() throws Exception {
        int userId = 1;
        ChangeUserStatusRequestDTO statusRequest = new ChangeUserStatusRequestDTO();
        statusRequest.setStatus(Users.UserStatus.ACTIVE);
        String content = objectMapper.writeValueAsString(statusRequest);
        mockMvc.perform(MockMvcRequestBuilders
                .patch("/api/admin/changestatus/{userId}", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(content))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("change user status successfully"));
        mockMvc.perform(patch("/api/admin/changestatus/{userId}", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andDo(print());
    }

    @Test
    void searchAccount_success() throws Exception {
        SearchAccountRequestDTO searchRequest = new SearchAccountRequestDTO();
        searchRequest.setKeyword("test");
        String content = objectMapper.writeValueAsString(searchRequest);
        given(adminService.searchUsers(any(SearchAccountRequestDTO.class))).willReturn(Collections.emptyList());
        mockMvc.perform(MockMvcRequestBuilders
                .post("/api/admin/search-account")
                .contentType(MediaType.APPLICATION_JSON)
                .content(content))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Search completed successfully"));
        mockMvc.perform(post("/api/admin/search-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andDo(print());
    }

    @Test
    void getAccountDetail_success() throws Exception {
        int userId = 1;
        UserDetailResponse userDetailResponse = new UserDetailResponse();
        given(adminService.getUserDetail(userId)).willReturn(userDetailResponse);
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/admin/userdetail/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User detail get successfully"));
        mockMvc.perform(get("/api/admin/userdetail/{userId}", userId))
                .andDo(print());
    }

    @Test
    void updateUser_success() throws Exception {
        int userId = 1;
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                .put("/api/admin/updateuser/{userId}", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(content))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("user update successfully"));
        mockMvc.perform(put("/api/admin/updateuser/{userId}", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andDo(print());
    }

    @Test
    void resetPassword_success() throws Exception {
        int userId = 1;
        mockMvc.perform(MockMvcRequestBuilders
                .put("/api/admin/reset-password/{userId}", userId))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/admin/reset-password/{userId}", userId))
                .andDo(print());
    }
}
