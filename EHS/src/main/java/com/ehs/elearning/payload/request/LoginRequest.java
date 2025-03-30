package com.ehs.elearning.payload.request;

import jakarta.validation.constraints.NotBlank;




public class LoginRequest {
   
	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	@NotBlank
    private String username;

    @NotBlank
    private String password;

	public LoginRequest(@NotBlank String username, @NotBlank String password) {
		super();
		this.username = username;
		this.password = password;
	}

	public LoginRequest() {
		super();
	}
    
    
}