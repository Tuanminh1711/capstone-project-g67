package com.plantcare_backend.dto.request.expert;

import lombok.*;

@Data
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ExpertDTO {
    private Integer id;
    private String username;
    private String role;
}
