package com.collegecms.backend.modules.leave.entity;

import com.collegecms.backend.modules.user.entity.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity 
@Table(name = "leaves")
public class Leave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String leaveType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private int days;

    @Column(nullable = false)
    private String status = "PENDING";

    // ✅ Student (MANDATORY)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // ✅ Mentor (optional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id")
    private User mentor;

    // ✅ Reviewer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(nullable = false)
    private LocalDateTime appliedAt;

    private LocalDateTime reviewedAt;

    // ===== GETTERS =====
    public Long getId() { return id; }

    public String getLeaveType() { return leaveType; }

    public String getReason() { return reason; }

    public LocalDate getStartDate() { return startDate; }

    public LocalDate getEndDate() { return endDate; }

    public int getDays() { return days; }

    public String getStatus() { return status; }

    public User getStudent() { return student; }

    public User getMentor() { return mentor; }

    public User getReviewedBy() { return reviewedBy; }

    public LocalDateTime getAppliedAt() { return appliedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }

    // ===== SETTERS =====
    public void setId(Long id) { this.id = id; }

    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }

    public void setReason(String reason) { this.reason = reason; }

    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public void setDays(int days) { this.days = days; }

    public void setStatus(String status) { this.status = status; }

    public void setStudent(User student) { this.student = student; }

    public void setMentor(User mentor) { this.mentor = mentor; }

    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}