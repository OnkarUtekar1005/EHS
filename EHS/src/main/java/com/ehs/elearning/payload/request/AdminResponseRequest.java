package com.ehs.elearning.payload.request;

import jakarta.validation.constraints.NotBlank;

public class AdminResponseRequest {
    
    @NotBlank(message = "Response is required")
    private String response;
    
    private String status;
    
    public String getResponse() {
        return response;
    }
    
    public void setResponse(String response) {
        this.response = response;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
}