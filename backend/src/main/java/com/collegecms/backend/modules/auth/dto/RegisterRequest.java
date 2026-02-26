package com.collegecms.backend.modules.auth.dto;

import com.collegecms.backend.modules.user.entity.Role;
import lombok.Data;

@Data
public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private Role role;

    // Student fields
    private String rollNo;
    private String branch;
    // private String studentName;

    // Mentor field
    private String facultyId;
    // private String mentorName;

    // Admin field
    private String adminId;
    // private String adminName;
}