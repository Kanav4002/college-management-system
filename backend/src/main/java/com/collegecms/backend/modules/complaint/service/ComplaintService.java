package com.collegecms.backend.modules.complaint.service;

import com.collegecms.backend.modules.complaint.dto.ComplaintResponse;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
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
    // Stats helpers (used by panels)
    // ──────────────────────────────────────────────────────────────

    public long countByStatus(ComplaintStatus status) {
        return complaintRepository.countByStatus(status);
    }

    public long countByStudent(String studentEmail) {
        User student = getUser(studentEmail);
        return complaintRepository.findByStudentOrderByCreatedAtDesc(student).size();
    }
}
