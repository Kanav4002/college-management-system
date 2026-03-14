package com.collegecms.backend.modules.auth.service;

import com.collegecms.backend.common.security.JwtService;
import com.collegecms.backend.common.email.EmailService;
import com.collegecms.backend.modules.auth.dto.*;
import com.collegecms.backend.modules.group.entity.StudentGroup;
import com.collegecms.backend.modules.group.repository.StudentGroupRepository;
import com.collegecms.backend.modules.user.entity.*;
import com.collegecms.backend.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
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
    private final StudentGroupRepository groupRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private LoginResponse buildLoginResponse(User user) {
        String token = jwtService.generateToken(user.getEmail());

        Long groupId = null;
        String groupName = null;
        if (user.getGroup() != null) {
            groupId = user.getGroup().getId();
            groupName = user.getGroup().getName();
        }

        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .name(user.getName())
                .groupId(groupId)
                .groupName(groupName)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // Register
    // ──────────────────────────────────────────────────────────────

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

        // Assign group if provided (for STUDENT / MENTOR)
        if (request.getGroupId() != null && request.getRole() != Role.ADMIN) {
            StudentGroup group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));
            user.setGroup(group);
        }

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

    // ──────────────────────────────────────────────────────────────
    // Login
    // ──────────────────────────────────────────────────────────────

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return buildLoginResponse(user);
    }

    // ──────────────────────────────────────────────────────────────
    // Google OAuth
    // ──────────────────────────────────────────────────────────────

    public LoginResponse loginWithGoogle(GoogleOAuthRequest request) {

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(request.getAccessToken());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<java.util.Map<String, Object>> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET,
                entity,
                new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {
                }
        );

        java.util.Map<String, Object> body = response.getBody();
        if (body == null || body.get("email") == null) {
            throw new RuntimeException("Unable to fetch Google user information");
        }

        String email = (String) body.get("email");
        Object verified = body.get("email_verified");
        boolean emailVerified = verified != null && Boolean.parseBoolean(verified.toString());

        if (!emailVerified) {
            throw new RuntimeException("Google account email is not verified");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "No account found for this Google email. Please register first."
                ));

        return buildLoginResponse(user);
    }

    // ──────────────────────────────────────────────────────────────
    // Password reset
    // ──────────────────────────────────────────────────────────────

    public String forgotPassword(ForgotPasswordRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = java.util.UUID.randomUUID().toString();

        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(30));
        resetToken.setUsed(false);

        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);

        return "If an account exists, a password reset link has been generated.";
    }

    public String resetPassword(ResetPasswordRequest request) {

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.isUsed() ||
                resetToken.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return "Password updated successfully";
    }
}
