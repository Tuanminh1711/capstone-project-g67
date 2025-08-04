package com.plantcare_backend.dto.response.expert;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDetailResponse implements Serializable{
    private Long id;
    private String categoryName;
    private String categoryDescription;
}
