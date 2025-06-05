package com.example.PlantCare_Website_Backend.dto.reponse;

public class ResponseError extends ResponseData {

    public ResponseError(int status, String message) {
        super(status, message);
    }
}
