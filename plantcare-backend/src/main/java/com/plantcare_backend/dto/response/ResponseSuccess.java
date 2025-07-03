package com.plantcare_backend.dto.response;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

/**
 * Create by TaHoang
 */

public class ResponseSuccess extends ResponseEntity<ResponseSuccess.payload> {

    // delete, patch, put
    public ResponseSuccess(HttpStatusCode status, String message) {
        super(new payload(status.value(), message), HttpStatus.OK);
    }
    // get, post
    public ResponseSuccess(HttpStatusCode status, String message, Object data) {
        super(new payload(status.value(), message, data), HttpStatus.OK);
    }

    public static class payload {
        private final int status;
        private final String message;
        private Object data;

        public payload(int status, String message) {
            this.status = status;
            this.message = message;
        }

        public payload(int status, String message, Object data) {
            this.status = status;
            this.message = message;
            this.data = data;
        }

        public String getMessage() {
            return message;
        }

        public Object getData() {
            return data;
        }

        public int getStatus() {
            return status;
        }
    }
}
