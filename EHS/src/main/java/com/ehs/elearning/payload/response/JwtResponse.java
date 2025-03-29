package com.ehs.elearning.payload.response;



import java.util.UUID;


public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private UUID id;
    public JwtResponse() {
		super();
	}

	public void setToken(String token) {
		this.token = token;
	}

	public void setType(String type) {
		this.type = type;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public void setRole(String role) {
		this.role = role;
	}

	private String username;
    private String email;
    private String role;
    
    public JwtResponse(String token, UUID id, String username, String email, String role) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
    }
    
    // Getters
    public String getToken() {
        return token;
    }
    
    public String getType() {
        return type;
    }
    
    public UUID getId() {
        return id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public String getRole() {
        return role;
    }
}