package com.example.demo.controller;

import com.example.demo.dto.request.UserRequestDTO;
import com.example.demo.dto.response.ResponseData;
import com.example.demo.dto.response.ResponseSuccess;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.apache.catalina.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * REST API
 */
@RestController
@RequestMapping("/user")
public class UserController {

    @PostMapping("/{userId}")
    public ResponseData<Integer> addUser(@Valid @RequestBody UserRequestDTO userDTO) {
        System.out.println("request add user" + userDTO.getFirstName());
        return new ResponseData<>(HttpStatus.CREATED.value(), "User added successfully", 1);
    }

    /**
     * Cập nhật thông tin người dùng bằng HTTP PUT method.
     *
     * @param userId ID của người dùng cần cập nhật, được truyền qua đường dẫn (path variable)
     * @param userDTO Đối tượng chứa các thông tin cập nhật của người dùng,
     *                được gửi trong body của request với định dạng JSON
     * @return Chuỗi thông báo kết quả cập nhật
     * @apiNote Phương thức này nhận yêu cầu PUT để cập nhật thông tin người dùng.
     *          Ví dụ đường dẫn: PUT /api/users/123
     *          Body request nên chứa JSON với các trường firstName, lastName, phone, email
     * @since 1.0
     */
    @PutMapping("/{userId}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseData<?> updateUser(@PathVariable @Min(1) int userId, @Valid @RequestBody UserRequestDTO userDTO) {
        System.out.println("Request User updated userId=" +userId);
        return new ResponseData<>(HttpStatus.ACCEPTED.value(), "user update success");
    }

    @PatchMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public String changeStatus(@PathVariable Long userId, @RequestParam boolean status) {
        System.out.println("Request User change userId=" +userId);
        return "User updated changed";
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public String deleteUser(@Min(1) @Max(5) @PathVariable Long userId) {
        System.out.println("Request User deleted userId=" +userId);
        return "User deleted successfully";
    }

    @GetMapping("/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public UserRequestDTO getUser(@PathVariable Long userId) {
        System.out.println("Request User retrieved userId=" +userId);
        return new UserRequestDTO("Ta","Hoang","0333201780","nguyentahoang15012003@gmail.com");
    }

    @GetMapping("/list")
    public List<UserRequestDTO> getAllUser() {
        System.out.println("Request User retrieved userId=");
        return List.of(new UserRequestDTO("Nguyen","Ta Hoang","0333201789","nguyentahoang15012003@gmail.com"),
                       new UserRequestDTO("Nguyen ","Ta","0987654321","tahoang@gmail.com"));
    }
}
