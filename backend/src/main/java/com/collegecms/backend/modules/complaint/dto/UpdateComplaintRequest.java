package com.collegecms.backend.modules.complaint.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for updating complaint details.
 * All fields are optional — only non-null values will be applied.
 */
@Data
public class UpdateComplaintRequest {
    private String title;
    private String description;
    private String category;
    private String issueType;
    private String building;
    private String floorNumber;
    private String roomNumber;
    private LocalDateTime problemStartedAt;
    private String priority;
}
