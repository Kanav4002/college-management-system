package com.collegecms.backend.modules.leave.service;

import com.collegecms.backend.modules.leave.dto.CreateLeaveRequest;
import com.collegecms.backend.modules.leave.dto.LeaveResponse;
import com.collegecms.backend.modules.leave.entity.Leave;
import com.collegecms.backend.modules.leave.repository.LeaveRepository;
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

    // ✅ Apply Leave
    public LeaveResponse applyLeave(String email, CreateLeaveRequest request) {

        // 🔥 STRICT USER FETCH (better error message)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found for email: " + email));

        // 🚨 DEBUG CHECK
        if (user == null) {
            throw new RuntimeException("User is NULL — cannot apply leave");
        }

        // ✅ Calculate days
        long days = ChronoUnit.DAYS.between(
                request.getStartDate(),
                request.getEndDate()
        ) + 1;

        // 🚨 Prevent invalid dates
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

        // 🔥 CRITICAL FIX (ENSURE student is set)
        leave.setStudent(user);

        // Optional: assign mentor later if needed
        leave.setMentor(null);

        leave.setAppliedAt(LocalDateTime.now());

        return mapToResponse(leaveRepository.save(leave));
    }

    // ✅ Get My Leaves
    public List<LeaveResponse> getMyLeaves(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return leaveRepository.findByStudent(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ✅ Mentor Panel
    public List<LeaveResponse> getAssignedLeaves(String email) {

        User mentor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        return leaveRepository.findByMentor(mentor)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ✅ Approve Leave
    public LeaveResponse approveLeave(Long id, String email) {

        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        User mentor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        leave.setStatus("APPROVED");
        leave.setReviewedBy(mentor);
        leave.setReviewedAt(LocalDateTime.now());

        return mapToResponse(leaveRepository.save(leave));
    }

    // ✅ Reject Leave
    public LeaveResponse rejectLeave(Long id, String email) {

        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        User mentor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        leave.setStatus("REJECTED");
        leave.setReviewedBy(mentor);
        leave.setReviewedAt(LocalDateTime.now());

        return mapToResponse(leaveRepository.save(leave));
    }

    // ✅ Mapper
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
                leave.getReviewedBy() != null ? leave.getReviewedBy().getEmail() : null,
                leave.getAppliedAt(),
                leave.getReviewedAt()
        );
    }
}