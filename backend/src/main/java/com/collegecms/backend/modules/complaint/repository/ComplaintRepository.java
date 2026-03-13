package com.collegecms.backend.modules.complaint.repository;

import com.collegecms.backend.modules.complaint.entity.Complaint;
import com.collegecms.backend.modules.complaint.entity.ComplaintStatus;
import com.collegecms.backend.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStudentOrderByCreatedAtDesc(User student);

    List<Complaint> findByMentorOrderByCreatedAtDesc(User mentor);

    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    long countByStatus(ComplaintStatus status);

    // ── Stats queries ──────────────────────────────────────────────
    long countByStudent(User student);

    long countByStudentAndStatus(User student, ComplaintStatus status);

    long countByMentor(User mentor);

    long countByMentorAndStatus(User mentor, ComplaintStatus status);

    long countByCategory(String category);
}
