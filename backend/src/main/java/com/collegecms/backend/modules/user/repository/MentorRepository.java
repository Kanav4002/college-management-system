package com.collegecms.backend.modules.user.repository;

import com.collegecms.backend.modules.user.entity.Mentor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MentorRepository extends JpaRepository<Mentor, Long> {
    Optional<Mentor> findByFacultyId(String facultyId);
}