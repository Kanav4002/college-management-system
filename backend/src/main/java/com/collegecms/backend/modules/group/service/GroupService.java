package com.collegecms.backend.modules.group.service;

import com.collegecms.backend.modules.group.dto.*;
import com.collegecms.backend.modules.group.entity.StudentGroup;
import com.collegecms.backend.modules.group.repository.StudentGroupRepository;
import com.collegecms.backend.modules.user.entity.Role;
import com.collegecms.backend.modules.user.entity.User;
import com.collegecms.backend.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final StudentGroupRepository groupRepository;
    private final UserRepository userRepository;

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void assertAdmin(User user) {
        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can manage groups");
        }
    }

    private long countMembers(StudentGroup group) {
        return userRepository.countByGroup(group);
    }

    // ──────────────────────────────────────────────────────────────
    // Public — list (available to all authenticated users)
    // ──────────────────────────────────────────────────────────────

    /** Returns all groups with their member counts. */
    public List<GroupResponse> getAllGroups() {
        return groupRepository.findAllByOrderByNameAsc()
                .stream()
                .map(g -> GroupResponse.from(g, countMembers(g)))
                .toList();
    }

    /** Returns a single group by ID. */
    public GroupResponse getGroup(Long id) {
        StudentGroup g = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return GroupResponse.from(g, countMembers(g));
    }

    /** Returns all members (users) of a given group. */
    public List<GroupMemberResponse> getGroupMembers(Long groupId) {
        StudentGroup g = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return userRepository.findByGroupOrderByRoleAscNameAsc(g)
                .stream()
                .map(GroupMemberResponse::from)
                .toList();
    }

    // ──────────────────────────────────────────────────────────────
    // Admin — CRUD
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public GroupResponse createGroup(String adminEmail, CreateGroupRequest req) {
        User admin = getUser(adminEmail);
        assertAdmin(admin);

        if (groupRepository.existsByName(req.getName())) {
            throw new RuntimeException("A group with this name already exists");
        }

        StudentGroup g = new StudentGroup();
        g.setName(req.getName());
        g.setDescription(req.getDescription());
        g.setCreatedAt(LocalDateTime.now());

        if (req.getMentorId() != null) {
            User mentor = userRepository.findById(req.getMentorId())
                    .orElseThrow(() -> new RuntimeException("Mentor user not found"));
            if (mentor.getRole() != Role.MENTOR) {
                throw new RuntimeException("The specified user is not a mentor");
            }
            g.setMentor(mentor);
        }

        StudentGroup saved = groupRepository.save(g);
        return GroupResponse.from(saved, 0);
    }

    @Transactional
    public GroupResponse updateGroup(String adminEmail, Long id, UpdateGroupRequest req) {
        User admin = getUser(adminEmail);
        assertAdmin(admin);

        StudentGroup g = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (req.getName() != null && !req.getName().equals(g.getName())) {
            if (groupRepository.existsByName(req.getName())) {
                throw new RuntimeException("A group with this name already exists");
            }
            g.setName(req.getName());
        }

        if (req.getDescription() != null) {
            g.setDescription(req.getDescription());
        }

        if (req.getMentorId() != null) {
            User mentor = userRepository.findById(req.getMentorId())
                    .orElseThrow(() -> new RuntimeException("Mentor user not found"));
            if (mentor.getRole() != Role.MENTOR) {
                throw new RuntimeException("The specified user is not a mentor");
            }
            g.setMentor(mentor);
        }

        g.setUpdatedAt(LocalDateTime.now());
        StudentGroup saved = groupRepository.save(g);
        return GroupResponse.from(saved, countMembers(saved));
    }

    @Transactional
    public void deleteGroup(String adminEmail, Long id) {
        User admin = getUser(adminEmail);
        assertAdmin(admin);

        StudentGroup g = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Remove group reference from all members first
        List<User> members = userRepository.findByGroupOrderByRoleAscNameAsc(g);
        for (User member : members) {
            member.setGroup(null);
        }
        userRepository.saveAll(members);

        groupRepository.delete(g);
    }

    // ──────────────────────────────────────────────────────────────
    // Admin — member management
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public GroupResponse addMember(String adminEmail, Long groupId, Long userId) {
        User admin = getUser(adminEmail);
        assertAdmin(admin);

        StudentGroup g = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ADMIN) {
            throw new RuntimeException("Admins cannot be added to groups");
        }

        user.setGroup(g);
        userRepository.save(user);

        return GroupResponse.from(g, countMembers(g));
    }

    @Transactional
    public GroupResponse removeMember(String adminEmail, Long groupId, Long userId) {
        User admin = getUser(adminEmail);
        assertAdmin(admin);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getGroup() == null || !user.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("User is not in this group");
        }

        user.setGroup(null);
        userRepository.save(user);

        StudentGroup g = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return GroupResponse.from(g, countMembers(g));
    }
}
