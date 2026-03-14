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
    // Department routing map (issue type → department)
    // ──────────────────────────────────────────────────────────────

    private static final Map<String, String> ISSUE_DEPARTMENT_MAP = Map.of(
            "Cleaning",          "Janitorial Staff",
            "IT / Network",      "IT Department",
            "Electrical",        "Electrical Maintenance",
            "Plumbing",          "Plumbing Maintenance",
            "Furniture",         "Facilities Management",
            "Civil / Structural","Civil Maintenance",
            "Pest Control",      "Pest Control Services"
    );

    private static final String DEFAULT_DEPARTMENT = "General Administration";

    // ──────────────────────────────────────────────────────────────
    // Internal helpers
    // ──────────────────────────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Map<ComplaintStatus, Long> countByStatus(List<Complaint> complaints) {
        return complaints.stream()
                .collect(Collectors.groupingBy(Complaint::getStatus, Collectors.counting()));
    }

    /**
     * Resolves the department for a given issue type using the routing map.
     */
    private String resolveDepartment(String issueType) {
        if (issueType == null || issueType.isEmpty()) {
            return DEFAULT_DEPARTMENT;
        }
        return ISSUE_DEPARTMENT_MAP.getOrDefault(issueType, DEFAULT_DEPARTMENT);
    }

    /**
     * Builds a Complaint entity from the request DTO (shared between
     * student and mentor submission).
     */
    private Complaint buildComplaint(CreateComplaintRequest req) {
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
        c.setCreatedAt(LocalDateTime.now());
        return c;
    }

    // ──────────────────────────────────────────────────────────────
    // Student APIs
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse createComplaint(String studentEmail, CreateComplaintRequest req) {
        User student = getUser(studentEmail);
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can create complaints via this endpoint");
        }

        Complaint c = buildComplaint(req);
        c.setStatus(ComplaintStatus.PENDING);
        c.setStudent(student);

        // Auto-assign the group's mentor if the student belongs to a group
        if (student.getGroup() != null && student.getGroup().getMentor() != null) {
            c.setMentor(student.getGroup().getMentor());
        }

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
     * Mentor submits a complaint → auto-routed to the appropriate department
     * based on issue type. Status is set to ASSIGNED immediately.
     */
    @Transactional
    public ComplaintResponse createMentorComplaint(String mentorEmail, CreateComplaintRequest req) {
        User mentor = getUser(mentorEmail);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can submit mentor complaints");
        }

        Complaint c = buildComplaint(req);
        c.setStatus(ComplaintStatus.ASSIGNED);
        c.setStudent(mentor);                                 // submitter
        c.setMentor(mentor);                                  // also the reviewing mentor
        c.setAssignedDepartment(resolveDepartment(req.getIssueType()));

        return ComplaintResponse.from(complaintRepository.save(c));
    }

    /**
     * Returns complaints the mentor has submitted themselves
     * (i.e. where student_id = mentor's user id).
     */
    public List<ComplaintResponse> getMentorOwnComplaints(String mentorEmail) {
        User mentor = getUser(mentorEmail);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can access their own complaints");
        }
        return complaintRepository.findByStudentOrderByCreatedAtDesc(mentor)
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    /**
     * Returns complaints relevant to this mentor:
     *  1. All complaints where this mentor is assigned (acted on or auto-assigned via group).
     *  2. All currently PENDING complaints from students in the mentor's group.
     *  3. If the mentor has no group, also includes all unassigned PENDING complaints.
     */
    public List<ComplaintResponse> getAssignedComplaints(String mentorEmail) {
        User mentor = getUser(mentorEmail);
        if (mentor.getRole() != Role.MENTOR) {
            throw new RuntimeException("Only mentors can access assigned complaints");
        }

        // 1. All complaints this mentor has already been assigned to
        List<Complaint> actedOn = new ArrayList<>(
                complaintRepository.findByMentorOrderByCreatedAtDesc(mentor));

        Set<Long> actedOnIds = actedOn.stream()
                .map(Complaint::getId)
                .collect(Collectors.toSet());

        // 2. PENDING complaints — show group-relevant or all unassigned
        List<Complaint> pending = complaintRepository.findByStatusOrderByCreatedAtDesc(ComplaintStatus.PENDING);
        for (Complaint p : pending) {
            if (actedOnIds.contains(p.getId())) continue;

            // If mentor has a group, only show pending complaints from their group students
            if (mentor.getGroup() != null) {
                User submitter = p.getStudent();
                if (submitter != null
                        && submitter.getGroup() != null
                        && submitter.getGroup().getId().equals(mentor.getGroup().getId())) {
                    actedOn.add(p);
                }
            } else {
                // No group assigned — show all pending (backward-compatible)
                actedOn.add(p);
            }
        }

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
        if (c.getStatus() != ComplaintStatus.APPROVED && c.getStatus() != ComplaintStatus.ASSIGNED) {
            throw new RuntimeException("Only APPROVED or ASSIGNED complaints can be resolved");
        }

        c.setStatus(ComplaintStatus.RESOLVED);
        c.setUpdatedAt(LocalDateTime.now());

        return ComplaintResponse.from(complaintRepository.save(c));
    }

    // ──────────────────────────────────────────────────────────────
    // Stats  (optimised — one query per endpoint instead of 5+)
    // ──────────────────────────────────────────────────────────────

    /** Student stats. */
    public ComplaintStatsResponse getStudentStats(String email) {
        User student = getUser(email);
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can access student stats");
        }

        List<Complaint> complaints = complaintRepository.findByStudentOrderByCreatedAtDesc(student);
        Map<ComplaintStatus, Long> statusCounts = countByStatus(complaints);

        Map<String, Long> byCategory = complaints.stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        return ComplaintStatsResponse.builder()
                .total(complaints.size())
                .pending(statusCounts.getOrDefault(ComplaintStatus.PENDING, 0L))
                .approved(statusCounts.getOrDefault(ComplaintStatus.APPROVED, 0L))
                .assigned(statusCounts.getOrDefault(ComplaintStatus.ASSIGNED, 0L))
                .rejected(statusCounts.getOrDefault(ComplaintStatus.REJECTED, 0L))
                .resolved(statusCounts.getOrDefault(ComplaintStatus.RESOLVED, 0L))
                .byCategory(byCategory)
                .build();
    }

    /** Mentor stats. */
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
                .assigned(statusCounts.getOrDefault(ComplaintStatus.ASSIGNED, 0L))
                .rejected(statusCounts.getOrDefault(ComplaintStatus.REJECTED, 0L))
                .resolved(statusCounts.getOrDefault(ComplaintStatus.RESOLVED, 0L))
                .byCategory(byCategory)
                .build();
    }

    /** Admin stats — system-wide. */
    public ComplaintStatsResponse getAdminStats(String email) {
        User admin = getUser(email);
        if (admin.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can access admin stats");
        }

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
                .assigned(statusCounts.getOrDefault(ComplaintStatus.ASSIGNED, 0L))
                .rejected(statusCounts.getOrDefault(ComplaintStatus.REJECTED, 0L))
                .resolved(statusCounts.getOrDefault(ComplaintStatus.RESOLVED, 0L))
                .byCategory(byCategory)
                .byIssueType(byIssueType)
                .byBuilding(byBuilding)
                .avgResolutionHours(avgHours)
                .build();
    }
}
