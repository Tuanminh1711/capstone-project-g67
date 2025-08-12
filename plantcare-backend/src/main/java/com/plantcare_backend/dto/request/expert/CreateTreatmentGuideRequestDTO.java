package com.plantcare_backend.dto.request.expert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTreatmentGuideRequestDTO {

    @NotNull(message = "Số thứ tự bước không được để trống")
    private Integer stepNumber;

    @NotBlank(message = "Tiêu đề bước không được để trống")
    @Size(max = 200, message = "Tiêu đề bước không được vượt quá 200 ký tự")
    private String title;

    @NotBlank(message = "Mô tả bước không được để trống")
    @Size(max = 2000, message = "Mô tả bước không được vượt quá 2000 ký tự")
    private String description;

    @Size(max = 100, message = "Thời gian thực hiện không được vượt quá 100 ký tự")
    private String duration;

    @Size(max = 100, message = "Tần suất thực hiện không được vượt quá 100 ký tự")
    private String frequency;

    private List<String> materials; // Danh sách vật liệu cần thiết

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String notes;
}
