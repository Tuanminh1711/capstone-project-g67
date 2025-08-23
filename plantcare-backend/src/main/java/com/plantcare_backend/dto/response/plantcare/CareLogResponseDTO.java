package com.plantcare_backend.dto.response.plantcare;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Data
@Builder
@Getter
@Setter
public class CareLogResponseDTO {
    private Long logId;
    private Date careDate;
    private String notes;
    private String imageUrl;
    private Date createdAt;

    // Có thể thêm thông tin bổ sung nếu muốn
    private String careTypeName;
    private String plantName;
}
