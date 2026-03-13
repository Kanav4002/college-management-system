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
    // Stats
    // ──────────────────────────────────────────────────────────────

    /** Student stats — only their own complaints. */
    public ComplaintStatsResponse getStudentStats(String email) {
        User student = getUser(email);
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can access student stats");
        }

        long total    = complaintRepository.countByStudent(student);
        long pending  = complaintRepository.countByStudentAndStatus(student, ComplaintStatus.PENDING);
        long approved = complaintRepository.countByStudentAndStatus(student, ComplaintStatus.APPROVED);
        long rejected = complaintRepository.countByStudentAndStatus(student, ComplaintStatus.REJECTED);
        long resolved = complaintRepository.countByStudentAndStatus(student, ComplaintStatus.RESOLVED);

        // Category breakdown for the student's complaints
        Map<String, Long> byCategory = complaintRepository.findByStudentOrderByCreatedAtDesc(student)
                .stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        return ComplaintStatsResponse.builder()
                .total(total).pending(pending).approved(approved)
                .rejected(rejected).resolved(resolved)
                .byCategory(byCategory)
                .build();
    }

    /** Mentor stats — complaints they've acted on + pending pool. */
    public ComplaintStatsResponse getMentorStats(String email) {
        User mentor = getUser(email);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can access mentor stats");
        }

        long acted    = complaintRepository.countByMentor(mentor);
        long approved = complaintRepository.countByMentorAndStatus(mentor, ComplaintStatus.APPROVED);
        long rejected = complaintRepository.countByMentorAndStatus(mentor, ComplaintStatus.REJECTED);
        long pending  = complaintRepository.countByStatus(ComplaintStatus.PENDING);

        // Category breakdown across complaints this mentor handled
        Map<String, Long> byCategory = complaintRepository.findByMentorOrderByCreatedAtDesc(mentor)
                .stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        return ComplaintStatsResponse.builder()
                .total(acted + pending).pending(pending)
                .approved(approved).rejected(rejected)
                .resolved(0)
                .byCategory(byCategory)
                .build();
    }

    /** Admin stats — system-wide. */
    public ComplaintStatsResponse getAdminStats(String email) {
        User admin = getUser(email);
        if (admin.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can access admin stats");
        }

        long total    = complaintRepository.count();
        long pending  = complaintRepository.countByStatus(ComplaintStatus.PENDING);
        long approved = complaintRepository.countByStatus(ComplaintStatus.APPROVED);
        long rejected = complaintRepository.countByStatus(ComplaintStatus.REJECTED);
        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);

        // Category breakdown across ALL complaints
        Map<String, Long> byCategory = complaintRepository.findAll()
                .stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        // Average resolution time (created → updatedAt for RESOLVED complaints)
        List<Complaint> resolvedList = complaintRepository.findByStatusOrderByCreatedAtDesc(ComplaintStatus.RESOLVED);
        Double avgHours = null;
        if (!resolvedList.isEmpty()) {
            avgHours = resolvedList.stream()
                    .filter(c -> c.getUpdatedAt() != null)
                    .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toHours())
                    .average()
                    .orElse(0);
        }

        return ComplaintStatsResponse.builder()
                .total(total).pending(pending).approved(approved)
                .rejected(rejected).resolved(resolved)
                .byCategory(byCategory)
                .avgResolutionHours(avgHours)
                .build();
    }
}
