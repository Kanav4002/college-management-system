package com.collegecms.backend.modules.group.controller;

import com.collegecms.backend.modules.group.dto.*;
import com.collegecms.backend.modules.group.service.GroupService;
import com.collegecms.backend.modules.user.entity.Role;
import com.collegecms.backend.modules.user.entity.User;
import com.collegecms.backend.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final UserRepository userRepository;

    // ── Public (all authenticated users) ──────────────────────────

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroup(id));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<GroupMemberResponse>> getGroupMembers(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupMembers(id));
    }

    // ── Admin — CRUD ──────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            Authentication auth,
            @RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(groupService.createGroup(auth.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupResponse> updateGroup(
            @PathVariable Long id,
            Authentication auth,
            @RequestBody UpdateGroupRequest request) {
        return ResponseEntity.ok(groupService.updateGroup(auth.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long id,
            Authentication auth) {
        groupService.deleteGroup(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // ── Admin — member management ─────────────────────────────────

    @PostMapping("/{id}/members/{userId}")
    public ResponseEntity<GroupResponse> addMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication auth) {
        return ResponseEntity.ok(groupService.addMember(auth.getName(), id, userId));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<GroupResponse> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication auth) {
        return ResponseEntity.ok(groupService.removeMember(auth.getName(), id, userId));
    }

    // ── User listing helpers (for admin group management UI) ──────

    /** All mentors (for assigning to groups). */
    @GetMapping("/mentors")
    public ResponseEntity<List<GroupMemberResponse>> getAllMentors() {
        return ResponseEntity.ok(
                userRepository.findByRoleOrderByNameAsc(Role.MENTOR)
                        .stream()
                        .map(GroupMemberResponse::from)
                        .toList()
        );
    }

    /** Users not yet assigned to any group (students + mentors). */
    @GetMapping("/unassigned/{role}")
    public ResponseEntity<List<GroupMemberResponse>> getUnassignedUsers(@PathVariable String role) {
        Role r = Role.valueOf(role.toUpperCase());
        return ResponseEntity.ok(
                userRepository.findByGroupIsNullAndRoleOrderByNameAsc(r)
                        .stream()
                        .map(GroupMemberResponse::from)
                        .toList()
        );
    }
}
