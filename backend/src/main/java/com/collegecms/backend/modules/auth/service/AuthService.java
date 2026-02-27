package com.collegecms.backend.modules.auth.service;

import com.collegecms.backend.common.security.JwtService;
import com.collegecms.backend.modules.auth.dto.LoginRequest;
import com.collegecms.backend.modules.auth.dto.LoginResponse;
import com.collegecms.backend.modules.auth.dto.RegisterRequest;
import com.collegecms.backend.modules.user.entity.*;
import com.collegecms.backend.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final MentorRepository mentorRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public String register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        switch (request.getRole()) {

            case STUDENT -> {
                Student student = new Student();
                student.setUser(savedUser);
                student.setName(request.getName());
                student.setRollNo(request.getRollNo());
                student.setBranch(request.getBranch());
                studentRepository.save(student);
            }

            case MENTOR -> {
                Mentor mentor = new Mentor();
                mentor.setUser(savedUser);
                mentor.setName(request.getName());
                mentor.setFacultyId(request.getFacultyId());
                mentorRepository.save(mentor);
            }

            case ADMIN -> {
                Admin admin = new Admin();
                admin.setUser(savedUser);
                admin.setName(request.getName());
                admin.setAdminId(request.getAdminId());
                adminRepository.save(admin);
            }
        }

        return "User registered successfully";
    }

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtService.generateToken(user.getEmail());

        return new LoginResponse(
                token,
                user.getEmail(),
                user.getRole().name()
        );
    }
}