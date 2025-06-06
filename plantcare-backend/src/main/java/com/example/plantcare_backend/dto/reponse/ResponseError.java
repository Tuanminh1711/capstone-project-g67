package com.example.plantcare_backend.dto.reponse;

/**
 * Create by TaHoang
 */

public class ResponseError extends ResponseData {

    public ResponseError(int status, String message) {
        super(status, message);
    }
}
