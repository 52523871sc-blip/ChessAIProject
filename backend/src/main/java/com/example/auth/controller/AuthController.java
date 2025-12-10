package com.example.auth.controller;

import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.ProfileResponse;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.entity.User;
import com.example.auth.service.TokenService;
import com.example.auth.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final UserService userService;
    private final TokenService tokenService;

    public AuthController(UserService userService, TokenService tokenService) {
        this.userService = userService;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            User u = userService.register(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ProfileResponse(
                    u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getBio()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return userService.findByUsername(req.getUsername())
                .filter(u -> userService.checkPassword(u, req.getPassword()))
                .<ResponseEntity<?>>map(u -> {
                    String token = tokenService.issueToken(u.getId());
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "user", new ProfileResponse(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getBio())
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials")));
    }
}
