package com.plantcare_backend.dto.response.base;

/**
 * Create by TaHoang
 */

public class ResponseError extends ResponseData {

    public ResponseError(int status, String message) {
        super(status, message);
    }
}
