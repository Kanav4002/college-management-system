package com.collegecms.backend.modules.complaint.dto;

import com.collegecms.backend.modules.complaint.entity.Complaint;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ComplaintResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String issueType;
    private String building;
    private String floorNumber;
    private String roomNumber;
    private LocalDateTime problemStartedAt;
    private String priority;
    private String status;
    private String studentName;
    private String studentEmail;
    private String mentorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ComplaintResponse from(Complaint c) {
        ComplaintResponse r = new ComplaintResponse();
        r.setId(c.getId());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setCategory(c.getCategory());
        r.setIssueType(c.getIssueType());
        r.setBuilding(c.getBuilding());
        r.setFloorNumber(c.getFloorNumber());
        r.setRoomNumber(c.getRoomNumber());
        r.setProblemStartedAt(c.getProblemStartedAt());
        r.setPriority(c.getPriority().name());
        r.setStatus(c.getStatus().name());
        r.setStudentName(c.getStudent().getName());
        r.setStudentEmail(c.getStudent().getEmail());
        if (c.getMentor() != null) {
            r.setMentorName(c.getMentor().getName());
        }
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }
}
