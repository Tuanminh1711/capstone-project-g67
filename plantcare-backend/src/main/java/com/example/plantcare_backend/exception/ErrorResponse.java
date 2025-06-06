package com.example.plantcare_backend.exception;

import java.util.Date;

/**
 * create by TaHoang
 */

public class ErrorResponse {
    private Date timestamp; // trả về thời gian gây ra lỗi
    private int status;
    private String path;
    private String error;
    private String message; // thông báo lỗi ở đâu và như thế nào

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public void setError(String error) {
        this.error = error;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getPath() {
        return path;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }
}
