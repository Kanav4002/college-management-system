package com.collegecms.backend.modules.complaint.controller;

import com.collegecms.backend.modules.complaint.dto.ComplaintResponse;
import com.collegecms.backend.modules.complaint.dto.CreateComplaintRequest;
import com.collegecms.backend.modules.complaint.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // ── Admin ─────────────────────────────────────────────────────

    @GetMapping("/all")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(Authentication auth) {
        return ResponseEntity.ok(complaintService.getAllComplaints(auth.getName()));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ComplaintResponse> resolveComplaint(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(complaintService.resolveComplaint(id, auth.getName()));
    }
}
