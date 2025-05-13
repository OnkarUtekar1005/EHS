package com.ehs.elearning.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.sql.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;


@Entity
@Table(name = "users", 
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "email")
    })
public class Users {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @NotBlank
    @Size(max = 50)
    private String username;
    
    @NotBlank
    @Size(max = 100)
    private String password;
    
    @NotBlank
    @Size(max = 100)
    @Email
    private String email;
    
    @Enumerated(EnumType.STRING)
    private Role role;
    
    private String firstName;
    private String lastName;
    private String jobTitle;
    private String department;
    private String lastGeneratedPassword; // Store the last generated password for admin export
    private Date lastPasswordReset; ;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_domains",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "domain_id")
    )
    private Set<Domain> domains = new HashSet<>();
    
    // Helper methods for domains
    public void addDomain(Domain domain) {
        this.domains.add(domain);
        domain.getUsers().add(this);
    }
    
    public void removeDomain(Domain domain) {
        this.domains.remove(domain);
        domain.getUsers().remove(this);
    }
    
    public boolean hasDomain(Domain domain) {
        return this.domains.contains(domain);
    }
    
    // Constructors
    public Users() {
    }
    
    public Users(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
    
    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Set<Domain> getDomains() {
        return domains;
    }

    public void setDomains(Set<Domain> domains) {
        this.domains = domains;
    }

    public String getLastGeneratedPassword() {
        return lastGeneratedPassword;
    }

    public void setLastGeneratedPassword(String lastGeneratedPassword) {
        this.lastGeneratedPassword = lastGeneratedPassword;
    }

    public Date getLastPasswordReset() {
        return lastPasswordReset;
    }

    public void setLastPasswordReset(Date lastPasswordReset) {
        this.lastPasswordReset = lastPasswordReset;
    }

}