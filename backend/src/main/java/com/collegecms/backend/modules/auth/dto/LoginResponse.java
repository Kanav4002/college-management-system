package com.collegecms.backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String email;
    private String role;
    private String name;

    // Group information
    private Long groupId;
    private String groupName;
}
