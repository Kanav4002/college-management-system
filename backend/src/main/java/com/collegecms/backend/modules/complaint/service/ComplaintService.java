package com.collegecms.backend.modules.complaint.service;

import com.collegecms.backend.modules.complaint.dto.ComplaintResponse;
import com.collegecms.backend.modules.complaint.dto.ComplaintStatsResponse;
import com.collegecms.backend.modules.complaint.dto.CreateComplaintRequest;
import com.collegecms.backend.modules.complaint.entity.Complaint;
import com.collegecms.backend.modules.complaint.entity.ComplaintStatus;
import com.collegecms.backend.modules.complaint.repository.ComplaintRepository;
import com.collegecms.backend.modules.user.entity.Role;
import com.collegecms.backend.modules.user.entity.User;
import com.collegecms.backend.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    // ──────────────────────────────────────────────────────────────
    // Internal helpers
    // ──────────────────────────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Count complaints by status from an in-memory list (avoids N separate
     * COUNT queries hitting the database).
     */
    private Map<ComplaintStatus, Long> countByStatus(List<Complaint> complaints) {
        return complaints.stream()
                .collect(Collectors.groupingBy(Complaint::getStatus, Collectors.counting()));
    }

    // ──────────────────────────────────────────────────────────────
    // Student APIs
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse createComplaint(String studentEmail, CreateComplaintRequest req) {
        User student = getUser(studentEmail);
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can create complaints");
        }

        Complaint c = new Complaint();
        c.setTitle(req.getTitle());
        c.setDescription(req.getDescription());
        c.setCategory(req.getCategory());
        c.setIssueType(req.getIssueType());
        c.setBuilding(req.getBuilding());
        c.setFloorNumber(req.getFloorNumber());
        c.setRoomNumber(req.getRoomNumber());
        c.setProblemStartedAt(req.getProblemStartedAt());
        c.setPriority(req.getPriority());
        c.setStatus(ComplaintStatus.PENDING);
        c.setStudent(student);
        c.setCreatedAt(LocalDateTime.now());

        return ComplaintResponse.from(complaintRepository.save(c));
    }

    public List<ComplaintResponse> getMyComplaints(String studentEmail) {
        User student = getUser(studentEmail);
        return complaintRepository.findByStudentOrderByCreatedAtDesc(student)
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    // ──────────────────────────────────────────────────────────────
    // Mentor APIs
    // ──────────────────────────────────────────────────────────────

    /**
     * Returns:
     *  1. All complaints this mentor has already acted on (approved / rejected).
     *  2. All currently PENDING complaints not yet assigned to any mentor.
     */
    public List<ComplaintResponse> getAssignedComplaints(String mentorEmail) {
        User mentor = getUser(mentorEmail);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can access assigned complaints");
        }

        List<Complaint> actedOn = new ArrayList<>(
                complaintRepository.findByMentorOrderByCreatedAtDesc(mentor));

        Set<Long> actedOnIds = actedOn.stream()
                .map(Complaint::getId)
                .collect(Collectors.toSet());

        complaintRepository.findByStatusOrderByCreatedAtDesc(ComplaintStatus.PENDING)
                .stream()
                .filter(p -> !actedOnIds.contains(p.getId()))
                .forEach(actedOn::add);

        return actedOn.stream().map(ComplaintResponse::from).toList();
    }

    @Transactional
    public ComplaintResponse approveComplaint(Long id, String mentorEmail) {
        User mentor = getUser(mentorEmail);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can approve complaints");
        }

        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        if (c.getStatus() != ComplaintStatus.PENDING) {
            throw new RuntimeException("Only PENDING complaints can be approved");
        }

        c.setStatus(ComplaintStatus.APPROVED);
        c.setMentor(mentor);
        c.setUpdatedAt(LocalDateTime.now());

        return ComplaintResponse.from(complaintRepository.save(c));
    }

    @Transactional
    public ComplaintResponse rejectComplaint(Long id, String mentorEmail) {
        User mentor = getUser(mentorEmail);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can reject complaints");
        }

        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        if (c.getStatus() != ComplaintStatus.PENDING) {
            throw new RuntimeException("Only PENDING complaints can be rejected");
        }

        c.setStatus(ComplaintStatus.REJECTED);
        c.setMentor(mentor);
        c.setUpdatedAt(LocalDateTime.now());

        return ComplaintResponse.from(complaintRepository.save(c));
    }

    // ──────────────────────────────────────────────────────────────
    // Admin APIs
    // ──────────────────────────────────────────────────────────────

    public List<ComplaintResponse> getAllComplaints(String adminEmail) {
        User admin = getUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can access all complaints");
        }
        return complaintRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    @Transactional
    public ComplaintResponse resolveComplaint(Long id, String adminEmail) {
        User admin = getUser(adminEmail);
        if (admin.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can resolve complaints");
        }

        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        if (c.getStatus() != ComplaintStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED complaints can be resolved");
        }

        c.setStatus(ComplaintStatus.RESOLVED);
        c.setUpdatedAt(LocalDateTime.now());

        return ComplaintResponse.from(complaintRepository.save(c));
    }

    // ──────────────────────────────────────────────────────────────
    // Stats  (optimised — one query per endpoint instead of 5+)
    // ──────────────────────────────────────────────────────────────

    /**
     * Student stats — fetch the student's complaints once and derive all
     * counts + category breakdown in memory.
     */
    public ComplaintStatsResponse getStudentStats(String email) {
        User student = getUser(email);
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can access student stats");
        }

        // Single DB query — @EntityGraph already joins student + mentor
        List<Complaint> complaints = complaintRepository.findByStudentOrderByCreatedAtDesc(student);

        Map<ComplaintStatus, Long> statusCounts = countByStatus(complaints);

        Map<String, Long> byCategory = complaints.stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        return ComplaintStatsResponse.builder()
                .total(complaints.size())
                .pending(statusCounts.getOrDefault(ComplaintStatus.PENDING, 0L))
                .approved(statusCounts.getOrDefault(ComplaintStatus.APPROVED, 0L))
                .rejected(statusCounts.getOrDefault(ComplaintStatus.REJECTED, 0L))
                .resolved(statusCounts.getOrDefault(ComplaintStatus.RESOLVED, 0L))
                .byCategory(byCategory)
                .build();
    }

    /**
     * Mentor stats — one query for the mentor's own complaints, one query
     * for the global pending pool.  Counts are derived in memory.
     */
    public ComplaintStatsResponse getMentorStats(String email) {
        User mentor = getUser(email);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can access mentor stats");
        }

        List<Complaint> acted = complaintRepository.findByMentorOrderByCreatedAtDesc(mentor);
        long pending = complaintRepository.countByStatus(ComplaintStatus.PENDING);

        Map<ComplaintStatus, Long> statusCounts = countByStatus(acted);

        Map<String, Long> byCategory = acted.stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        return ComplaintStatsResponse.builder()
                .total(acted.size() + pending)
                .pending(pending)
                .approved(statusCounts.getOrDefault(ComplaintStatus.APPROVED, 0L))
                .rejected(statusCounts.getOrDefault(ComplaintStatus.REJECTED, 0L))
                .resolved(0)
                .byCategory(byCategory)
                .build();
    }

    /**
     * Admin stats — fetch all complaints once and compute every breakdown
     * (status counts, category, issue type, building, avg resolution time)
     * in memory.
     */
    public ComplaintStatsResponse getAdminStats(String email) {
        User admin = getUser(email);
        if (admin.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can access admin stats");
        }

        // Single DB query — @EntityGraph joins student + mentor
        List<Complaint> all = complaintRepository.findAllByOrderByCreatedAtDesc();

        Map<ComplaintStatus, Long> statusCounts = countByStatus(all);

        Map<String, Long> byCategory = all.stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        Map<String, Long> byIssueType = all.stream()
                .filter(c -> c.getIssueType() != null && !c.getIssueType().isEmpty())
                .collect(Collectors.groupingBy(Complaint::getIssueType, Collectors.counting()));

        Map<String, Long> byBuilding = all.stream()
                .filter(c -> c.getBuilding() != null && !c.getBuilding().isEmpty())
                .collect(Collectors.groupingBy(Complaint::getBuilding, Collectors.counting()));

        // Average resolution time (created → updatedAt for RESOLVED complaints)
        Double avgHours = null;
        List<Complaint> resolvedList = all.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED && c.getUpdatedAt() != null)
                .toList();
        if (!resolvedList.isEmpty()) {
            avgHours = resolvedList.stream()
                    .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toHours())
                    .average()
                    .orElse(0);
        }

        return ComplaintStatsResponse.builder()
                .total(all.size())
                .pending(statusCounts.getOrDefault(ComplaintStatus.PENDING, 0L))
                .approved(statusCounts.getOrDefault(ComplaintStatus.APPROVED, 0L))
                .rejected(statusCounts.getOrDefault(ComplaintStatus.REJECTED, 0L))
                .resolved(statusCounts.getOrDefault(ComplaintStatus.RESOLVED, 0L))
                .byCategory(byCategory)
                .byIssueType(byIssueType)
                .byBuilding(byBuilding)
                .avgResolutionHours(avgHours)
                .build();
    }
}
