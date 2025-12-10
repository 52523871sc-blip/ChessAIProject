package com.example.auth.controller;

import com.example.auth.dto.ProfileResponse;
import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.TokenService;
import com.example.auth.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {
    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final UserService userService;

    public ProfileController(TokenService tokenService, UserRepository userRepository, UserService userService) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    private User requireUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring("Bearer ".length());
        Long userId = tokenService.getUserId(token);
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(name = "Authorization", required = false) String authHeader) {
        User u = requireUser(authHeader);
        if (u == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        return ResponseEntity.ok(new ProfileResponse(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getBio()));
    }

    @PutMapping("/me")
    public ResponseEntity<?> update(@RequestHeader(name = "Authorization", required = false) String authHeader,
                                    @RequestBody Map<String, String> body) {
        User u = requireUser(authHeader);
        if (u == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String email = body.getOrDefault("email", u.getEmail());
        String fullName = body.getOrDefault("fullName", u.getFullName());
        String bio = body.getOrDefault("bio", u.getBio());
        User updated = userService.updateProfile(u, email, fullName, bio);
        return ResponseEntity.ok(new ProfileResponse(updated.getId(), updated.getUsername(), updated.getEmail(), updated.getFullName(), updated.getBio()));
    }
}
