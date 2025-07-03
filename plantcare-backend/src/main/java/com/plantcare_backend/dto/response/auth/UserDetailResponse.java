package com.plantcare_backend.dto.response.auth;

import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.util.Gender;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * Create by TaHoang
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse implements Serializable {
    private int id;
    private String username;
    private String email;
    private Users.UserStatus status;
    private Role.RoleName role;
    private String fullName;
    private String phone;
    private Gender gender;
    private String avatarUrl;
    private String livingEnvironment;
}
