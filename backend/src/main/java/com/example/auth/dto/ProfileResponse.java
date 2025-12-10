package com.example.auth.dto;

public class ProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String bio;

    public ProfileResponse() {}

    public ProfileResponse(Long id, String username, String email, String fullName, String bio) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.bio = bio;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
