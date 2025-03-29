package com.ehs.elearning.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


import java.util.UUID;

@Entity
@Table(name = "domains")

public class Domain {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @NotBlank
    @Size(max = 100)
    private String name;
    
    @Size(max = 500)
    private String description;
    
    public Domain(String name, String description) {
        this.name = name;
        this.description = description;
    }
    public Domain() {
    	
    }
	public UUID getId() {
		return id;
	}
	public void setId(UUID id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public Domain(UUID id, @NotBlank @Size(max = 100) String name, @Size(max = 500) String description) {
		super();
		this.id = id;
		this.name = name;
		this.description = description;
	}

    
}