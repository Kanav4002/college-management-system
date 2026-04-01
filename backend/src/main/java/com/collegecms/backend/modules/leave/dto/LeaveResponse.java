package com.collegecms.backend.modules.leave.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveResponse {

    private Long id;
    private String leaveType;
    private String reason;

    private LocalDate startDate;
    private LocalDate endDate;
    private int days;

    private String status;

    private String studentEmail;
    private String studentName;   // ✅ FIXED POSITION
    private String mentorEmail;

    private LocalDateTime appliedAt;
    private LocalDateTime reviewedAt;

    // ✅ CORRECT CONSTRUCTOR ORDER
    public LeaveResponse(Long id, String leaveType, String reason,
                         LocalDate startDate, LocalDate endDate, int days,
                         String status,
                         String studentEmail,
                         String studentName,   // ✅ HERE
                         String mentorEmail,
                         LocalDateTime appliedAt,
                         LocalDateTime reviewedAt) {

        this.id = id;
        this.leaveType = leaveType;
        this.reason = reason;
        this.startDate = startDate;
        this.endDate = endDate;
        this.days = days;
        this.status = status;
        this.studentEmail = studentEmail;
        this.studentName = studentName;
        this.mentorEmail = mentorEmail;
        this.appliedAt = appliedAt;
        this.reviewedAt = reviewedAt;
    }

    // ✅ Getters
    public Long getId() { return id; }
    public String getLeaveType() { return leaveType; }
    public String getReason() { return reason; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public int getDays() { return days; }
    public String getStatus() { return status; }
    public String getStudentEmail() { return studentEmail; }
    public String getStudentName() { return studentName; }
    public String getMentorEmail() { return mentorEmail; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
}