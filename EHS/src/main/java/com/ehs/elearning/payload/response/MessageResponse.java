package com.ehs.elearning.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;


@AllArgsConstructor
public class MessageResponse {
    private String message;

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public MessageResponse(String message) {
		super();
		this.message = message;
	}
    
}