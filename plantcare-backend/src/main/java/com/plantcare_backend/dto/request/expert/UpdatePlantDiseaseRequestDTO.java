package com.plantcare_backend.dto.request.expert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePlantDiseaseRequestDTO {

    @NotBlank(message = "Tên bệnh không được để trống")
    @Size(max = 200, message = "Tên bệnh không được vượt quá 200 ký tự")
    private String diseaseName;

    @Size(max = 200, message = "Tên khoa học không được vượt quá 200 ký tự")
    private String scientificName;

    @NotBlank(message = "Danh mục bệnh không được để trống")
    @Size(max = 50, message = "Danh mục bệnh không được vượt quá 50 ký tự")
    private String category; // Nấm, Vi khuẩn, Virus, Sinh lý, Côn trùng

    @NotBlank(message = "Triệu chứng không được để trống")
    @Size(max = 2000, message = "Triệu chứng không được vượt quá 2000 ký tự")
    private String symptoms;

    @Size(max = 2000, message = "Nguyên nhân không được vượt quá 2000 ký tự")
    private String causes;

    @Size(max = 2000, message = "Hướng dẫn điều trị không được vượt quá 2000 ký tự")
    private String treatment;

    @Size(max = 2000, message = "Biện pháp phòng ngừa không được vượt quá 2000 ký tự")
    private String prevention;

    @NotBlank(message = "Mức độ nghiêm trọng không được để trống")
    @Size(max = 20, message = "Mức độ nghiêm trọng không được vượt quá 20 ký tự")
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Size(max = 1000, message = "Loại cây bị ảnh hưởng không được vượt quá 1000 ký tự")
    private String affectedPlantTypes; // JSON array hoặc comma-separated

    @Size(max = 500, message = "URL hình ảnh không được vượt quá 500 ký tự")
    private String imageUrl;

    @Size(max = 50, message = "Mức độ tin cậy không được vượt quá 50 ký tự")
    private String confidenceLevel;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;
}
