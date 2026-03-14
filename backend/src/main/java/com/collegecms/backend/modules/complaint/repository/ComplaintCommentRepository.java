package com.collegecms.backend.modules.complaint.repository;

import com.collegecms.backend.modules.complaint.entity.ComplaintComment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintCommentRepository extends JpaRepository<ComplaintComment, Long> {

    @EntityGraph(attributePaths = {"author"})
    List<ComplaintComment> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);

    long countByComplaintId(Long complaintId);
}
