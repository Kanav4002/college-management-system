package com.collegecms.backend.common.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // ── Public ────────────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/groups").permitAll()

                        // ── Admin-only endpoints ──────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/complaints/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/close").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/assign").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/complaints/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/complaints/all").hasRole("ADMIN")
                        .requestMatchers("/api/complaints/stats/admin").hasRole("ADMIN")

                        // ── Mentor-only endpoints ─────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/complaints/mentor").hasRole("MENTOR")
                        .requestMatchers(HttpMethod.GET, "/api/complaints/mentor/my").hasRole("MENTOR")
                        .requestMatchers(HttpMethod.GET, "/api/complaints/assigned").hasRole("MENTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/approve").hasRole("MENTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/reject").hasRole("MENTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/escalate").hasRole("MENTOR")
                        .requestMatchers("/api/complaints/stats/mentor").hasRole("MENTOR")

                        // ── Student-only endpoints ────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/complaints/my").hasRole("STUDENT")
                        .requestMatchers("/api/complaints/stats/student").hasRole("STUDENT")

                        // ── Shared authenticated endpoints ────────────────
                        // POST /api/complaints (student create) — needs STUDENT role
                        .requestMatchers(HttpMethod.POST, "/api/complaints").hasRole("STUDENT")
                        // Comments — any authenticated user
                        .requestMatchers("/api/complaints/*/comments").authenticated()
                        // Resolve & Update (admin checks in service layer)
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/resolve").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*").hasRole("ADMIN")

                        // ── Group management — admin-only CRUD ────────────
                        .requestMatchers(HttpMethod.POST, "/api/groups").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/groups/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/groups/**").hasRole("ADMIN")

                        // ── Everything else requires authentication ───────
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
