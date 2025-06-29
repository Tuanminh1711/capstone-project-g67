package com.plantcare_backend.dto.request.admin;

import com.plantcare_backend.model.Users;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChangeUserStatusRequestDTO {
    @NotNull(message = "Status cannot be null")
    private Users.UserStatus status;
}
