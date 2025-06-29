package com.plantcare_backend.dto.request.plants;

import lombok.Data;

import java.sql.Timestamp;

@Data
public class PlantGetAllRequestDTO {
    private int id;
    private String imageUrl;
    private String scientificName;
    private String commonName;
    private String status;
    private Timestamp createdAt;
    private Integer page = 0;
    private Integer size = 10;
}
