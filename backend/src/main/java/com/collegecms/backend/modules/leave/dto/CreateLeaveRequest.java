package com.collegecms.backend.modules.leave.dto;

import java.time.LocalDate;

public class CreateLeaveRequest {

    private String leaveType;
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;

    // ✅ Getters
    public String getLeaveType() {
        return leaveType;
    }

    public String getReason() {
        return reason;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    // ✅ Setters
    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}