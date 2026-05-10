package com.collegecms.backend.modules.leave.controller;

import com.collegecms.backend.modules.leave.dto.CreateLeaveRequest;
import com.collegecms.backend.modules.leave.dto.LeaveResponse;
import com.collegecms.backend.modules.leave.service.LeaveService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    // ── Student ─────────────────────────────

    @PostMapping
    public ResponseEntity<LeaveResponse> applyLeave(
            Authentication auth,
            @RequestBody CreateLeaveRequest request) {
        return ResponseEntity.ok(
                leaveService.applyLeave(auth.getName(), request)
        );
    }

    @GetMapping("/my")
    public ResponseEntity<List<LeaveResponse>> getMyLeaves(Authentication auth) {
        return ResponseEntity.ok(
                leaveService.getMyLeaves(auth.getName())
        );
    }

    // ── Mentor ─────────────────────────────

    @GetMapping("/assigned")
    public ResponseEntity<List<LeaveResponse>> getAssignedLeaves(Authentication auth) {
        return ResponseEntity.ok(
                leaveService.getAssignedLeaves(auth.getName())
        );
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<LeaveResponse> approveLeave(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(
                leaveService.approveLeave(id, auth.getName())
        );
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<LeaveResponse> rejectLeave(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(
                leaveService.rejectLeave(id, auth.getName())
        );
    }
}