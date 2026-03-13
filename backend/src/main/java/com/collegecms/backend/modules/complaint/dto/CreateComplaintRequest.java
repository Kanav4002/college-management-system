package com.collegecms.backend.modules.complaint.dto;

import com.collegecms.backend.modules.complaint.entity.Priority;
import lombok.Data;

@Data
public class CreateComplaintRequest {
    private String title;
    private String description;
    private String category;
    private Priority priority;
}
