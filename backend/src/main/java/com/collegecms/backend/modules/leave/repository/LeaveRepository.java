package com.collegecms.backend.modules.leave.repository;

import com.collegecms.backend.modules.leave.entity.Leave;
import com.collegecms.backend.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRepository extends JpaRepository<Leave, Long> {

    // Student → see their leaves
    List<Leave> findByStudent(User student);

    // Mentor → see assigned leaves
    List<Leave> findByMentor(User mentor);

    // Filter by status
    List<Leave> findByMentorAndStatus(User mentor, String status);

}