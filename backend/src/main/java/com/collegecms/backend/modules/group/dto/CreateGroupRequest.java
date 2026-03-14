package com.collegecms.backend.modules.group.dto;

import lombok.Data;

@Data
public class CreateGroupRequest {
    private String name;
    private String description;
    private Long mentorId;
}
