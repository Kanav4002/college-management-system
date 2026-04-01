package com.collegecms.backend.modules.leave.service;

import com.collegecms.backend.modules.leave.dto.CreateLeaveRequest;
import com.collegecms.backend.modules.leave.dto.LeaveResponse;
import com.collegecms.backend.modules.leave.entity.Leave;
import com.collegecms.backend.modules.leave.repository.LeaveRepository;
import com.collegecms.backend.modules.user.entity.Role;
import com.collegecms.backend.modules.user.entity.User;
import com.collegecms.backend.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final UserRepository userRepository;

    public LeaveService(LeaveRepository leaveRepository, UserRepository userRepository) {
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
    }

    // ────────────────────────────────────────────────
    // Helper
    // ────────────────────────────────────────────────
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ────────────────────────────────────────────────
    // Apply Leave (Student)
    // ────────────────────────────────────────────────
    public LeaveResponse applyLeave(String email, CreateLeaveRequest request) {

        User student = getUser(email);

        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can apply for leave");
        }

        long days = ChronoUnit.DAYS.between(
                request.getStartDate(),
                request.getEndDate()
        ) + 1;

        if (days <= 0) {
            throw new RuntimeException("Invalid date range");
        }

        Leave leave = new Leave();

        leave.setLeaveType(request.getLeaveType());
        leave.setReason(request.getReason());
        leave.setStartDate(request.getStartDate());
        leave.setEndDate(request.getEndDate());
        leave.setDays((int) days);

        leave.setStatus("PENDING");
        leave.setStudent(student);

        
        if (student.getGroup() != null && student.getGroup().getMentor() != null) {
            leave.setMentor(student.getGroup().getMentor());
        } else {
            // 🔥 FALLBACK → assign any mentor (so system always works)
            User mentor = userRepository.findAll()
                    .stream()
                    .filter(u -> u.getRole() == Role.MENTOR)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No mentor available"));

            leave.setMentor(mentor);
        }

        leave.setAppliedAt(LocalDateTime.now());

        return mapToResponse(leaveRepository.save(leave));
    }

    // ────────────────────────────────────────────────
    // Student: My Leaves
    // ────────────────────────────────────────────────
    public List<LeaveResponse> getMyLeaves(String email) {
        User student = getUser(email);

        return leaveRepository.findByStudent(student)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ────────────────────────────────────────────────
    // Mentor: Assigned Leaves
    // ────────────────────────────────────────────────
    public List<LeaveResponse> getAssignedLeaves(String email) {

        User mentor = getUser(email);

        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can access assigned leaves");
        }

        return leaveRepository.findByMentor(mentor)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ────────────────────────────────────────────────
    // Approve
    // ────────────────────────────────────────────────
    public LeaveResponse approveLeave(Long id, String email) {

        User mentor = getUser(email);

        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can approve leaves");
        }

        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        leave.setStatus("APPROVED");
        leave.setReviewedBy(mentor);
        leave.setReviewedAt(LocalDateTime.now());

        return mapToResponse(leaveRepository.save(leave));
    }

    // ────────────────────────────────────────────────
    // Reject
    // ────────────────────────────────────────────────
    public LeaveResponse rejectLeave(Long id, String email) {

        User mentor = getUser(email);

        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can reject leaves");
        }

        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        leave.setStatus("REJECTED");
        leave.setReviewedBy(mentor);
        leave.setReviewedAt(LocalDateTime.now());

        return mapToResponse(leaveRepository.save(leave));
    }

    // ────────────────────────────────────────────────
    // Mapper
    // ────────────────────────────────────────────────
    private LeaveResponse mapToResponse(Leave leave) {
        return new LeaveResponse(
    leave.getId(),
    leave.getLeaveType(),
    leave.getReason(),
    leave.getStartDate(),
    leave.getEndDate(),
    leave.getDays(),
    leave.getStatus(),
    leave.getStudent() != null ? leave.getStudent().getEmail() : null,
    leave.getStudent() != null ? leave.getStudent().getName() : null, // ✅ studentName
    leave.getReviewedBy() != null ? leave.getReviewedBy().getEmail() : null,
    leave.getAppliedAt(),
    leave.getReviewedAt()
);
    }
}