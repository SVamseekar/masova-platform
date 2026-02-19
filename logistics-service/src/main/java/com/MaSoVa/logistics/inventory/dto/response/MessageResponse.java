package com.MaSoVa.logistics.inventory.dto.response;

/**
 * Generic response DTO for success messages
 */
public class MessageResponse {
    private String message;

    public MessageResponse() {}

    public MessageResponse(String message) {
        this.message = message;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
