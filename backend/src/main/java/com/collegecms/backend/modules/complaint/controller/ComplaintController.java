package com.collegecms.backend.modules.complaint.controller;

import com.collegecms.backend.modules.complaint.dto.*;
import com.collegecms.backend.modules.complaint.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    // ── Student ───────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(
            Authentication auth,
            @RequestBody CreateComplaintRequest request) {
        return ResponseEntity.ok(complaintService.createComplaint(auth.getName(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(Authentication auth) {
        return ResponseEntity.ok(complaintService.getMyComplaints(auth.getName()));
    }

    // ── Mentor ────────────────────────────────────────────────────

    /** Mentor submits their own complaint (auto-routed to department). */
    @PostMapping("/mentor")
    public ResponseEntity<ComplaintResponse> createMentorComplaint(
            Authentication auth,
            @RequestBody CreateComplaintRequest request) {
        return ResponseEntity.ok(complaintService.createMentorComplaint(auth.getName(), request));
    }

    /** Mentor's own submitted complaints. */
    @GetMapping("/mentor/my")
    public ResponseEntity<List<ComplaintResponse>> getMentorOwnComplaints(Authentication auth) {
        return ResponseEntity.ok(complaintService.getMentorOwnComplaints(auth.getName()));
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<ComplaintResponse>> getAssignedComplaints(Authentication auth) {
        return ResponseEntity.ok(complaintService.getAssignedComplaints(auth.getName()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ComplaintResponse> approveComplaint(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(complaintService.approveComplaint(id, auth.getName()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ComplaintResponse> rejectComplaint(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(complaintService.rejectComplaint(id, auth.getName()));
    }

    /** Mentor escalates a complaint to admin (approves + assigns department). */
    @PutMapping("/{id}/escalate")
    public ResponseEntity<ComplaintResponse> escalateComplaint(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(complaintService.escalateComplaint(id, auth.getName()));
    }

    // ── Admin ─────────────────────────────────────────────────────

    /** Admin creates a complaint (on behalf of anyone). */
    @PostMapping("/admin")
    public ResponseEntity<ComplaintResponse> adminCreateComplaint(
            Authentication auth,
            @RequestBody CreateComplaintRequest request) {
        return ResponseEntity.ok(complaintService.adminCreateComplaint(auth.getName(), request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(Authentication auth) {
        return ResponseEntity.ok(complaintService.getAllComplaints(auth.getName()));
    }

    /** Admin updates complaint details. */
    @PutMapping("/{id}")
    public ResponseEntity<ComplaintResponse> updateComplaint(
            @PathVariable Long id,
            Authentication auth,
            @RequestBody UpdateComplaintRequest request) {
        return ResponseEntity.ok(complaintService.updateComplaint(id, auth.getName(), request));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ComplaintResponse> resolveComplaint(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(complaintService.resolveComplaint(id, auth.getName()));
    }

    /** Admin closes a complaint (any status). */
    @PutMapping("/{id}/close")
    public ResponseEntity<ComplaintResponse> closeComplaint(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(complaintService.closeComplaint(id, auth.getName()));
    }

    /** Admin assigns complaint to a department/authority. */
    @PutMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assignComplaint(
            @PathVariable Long id,
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String department = body.get("department");
        if (department == null || department.isBlank()) {
            throw new RuntimeException("Department is required");
        }
        return ResponseEntity.ok(complaintService.assignComplaint(id, auth.getName(), department));
    }

    /** Admin deletes a complaint. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteComplaint(
            @PathVariable Long id,
            Authentication auth) {
        complaintService.deleteComplaint(id, auth.getName());
        return ResponseEntity.ok(Map.of("message", "Complaint #" + id + " deleted successfully"));
    }

    // ── Comments ──────────────────────────────────────────────────

    /** Add a comment to a complaint (any authenticated user with access). */
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            Authentication auth,
            @RequestBody CommentRequest request) {
        return ResponseEntity.ok(complaintService.addComment(id, auth.getName(), request));
    }

    /** Get all comments for a complaint. */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(complaintService.getComments(id, auth.getName()));
    }

    // ── Stats ──────────────────────────────────────────────────────

    @GetMapping("/stats/student")
    public ResponseEntity<ComplaintStatsResponse> studentStats(Authentication auth) {
        return ResponseEntity.ok(complaintService.getStudentStats(auth.getName()));
    }

    @GetMapping("/stats/mentor")
    public ResponseEntity<ComplaintStatsResponse> mentorStats(Authentication auth) {
        return ResponseEntity.ok(complaintService.getMentorStats(auth.getName()));
    }

    @GetMapping("/stats/admin")
    public ResponseEntity<ComplaintStatsResponse> adminStats(Authentication auth) {
        return ResponseEntity.ok(complaintService.getAdminStats(auth.getName()));
    }
}
