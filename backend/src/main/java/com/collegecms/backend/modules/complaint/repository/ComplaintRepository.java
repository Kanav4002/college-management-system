package com.collegecms.backend.modules.complaint.repository;

import com.collegecms.backend.modules.complaint.entity.Complaint;
import com.collegecms.backend.modules.complaint.entity.ComplaintStatus;
import com.collegecms.backend.modules.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // ── Eagerly fetch student + student.group + mentor to avoid N+1 / LazyInit ──

    @EntityGraph(attributePaths = {"student", "student.group", "mentor"})
    List<Complaint> findByStudentOrderByCreatedAtDesc(User student);

    @EntityGraph(attributePaths = {"student", "student.group", "mentor"})
    List<Complaint> findByMentorOrderByCreatedAtDesc(User mentor);

    @EntityGraph(attributePaths = {"student", "student.group", "mentor"})
    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    @EntityGraph(attributePaths = {"student", "student.group", "mentor"})
    List<Complaint> findAllByOrderByCreatedAtDesc();

    long countByStatus(ComplaintStatus status);

    // ── Stats queries ──────────────────────────────────────────────
    long countByStudent(User student);

    long countByStudentAndStatus(User student, ComplaintStatus status);

    long countByMentor(User mentor);

    long countByMentorAndStatus(User mentor, ComplaintStatus status);

    long countByCategory(String category);
}
