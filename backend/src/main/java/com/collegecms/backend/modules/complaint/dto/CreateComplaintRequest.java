package com.collegecms.backend.modules.complaint.dto;

import com.collegecms.backend.modules.complaint.entity.Priority;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateComplaintRequest {
    private String title;
    private String description;
    private String category;
    private String issueType;
    private String building;
    private String floorNumber;
    private String roomNumber;
    private LocalDateTime problemStartedAt;
    private Priority priority;
}
