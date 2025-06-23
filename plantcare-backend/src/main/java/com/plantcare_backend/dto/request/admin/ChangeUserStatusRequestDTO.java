package com.plantcare_backend.dto.request.admin;

import com.plantcare_backend.model.Users;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ChangeUserStatusRequestDTO {
    @NotNull(message = "Status cannot be null")
    private Users.UserStatus status;
}
