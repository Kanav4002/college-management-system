package com.collegecms.backend.modules.auth.controller;

import com.collegecms.backend.modules.auth.dto.LoginRequest;
import com.collegecms.backend.modules.auth.dto.RegisterRequest;
import com.collegecms.backend.modules.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}