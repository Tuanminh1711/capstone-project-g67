package com.plantcare_backend.dto.request.admin;

import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SearchAccountRequestDTO {
    private String keyword;
    private Role.RoleName role;
    private Users.UserStatus userStatus;
    private int pageNo = 0;
    private int pageSize = 10;
}
