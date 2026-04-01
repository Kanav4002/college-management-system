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
                .cors(cors -> cors.disable())
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

                        // ── Shared complaint endpoints ────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/complaints").hasRole("STUDENT")
                        .requestMatchers("/api/complaints/*/comments").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*/resolve").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/complaints/*").hasRole("ADMIN")

                        // ── Group management ──────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/groups").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/groups/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/groups/**").hasRole("ADMIN")

                        // ── Leave: Student endpoints ──────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/leaves").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/api/leaves/my").hasRole("STUDENT")

                        // ── Leave: Mentor endpoints ───────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/leaves/assigned").hasRole("MENTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/leaves/*/approve").hasRole("MENTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/leaves/*/reject").hasRole("MENTOR")

                        // ── Everything else requires authentication ───────
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}