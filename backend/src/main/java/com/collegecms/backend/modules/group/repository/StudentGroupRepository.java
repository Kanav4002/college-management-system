package com.collegecms.backend.modules.group.repository;

import com.collegecms.backend.modules.group.entity.StudentGroup;
import com.collegecms.backend.modules.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentGroupRepository extends JpaRepository<StudentGroup, Long> {

    @EntityGraph(attributePaths = {"mentor"})
    List<StudentGroup> findAllByOrderByNameAsc();

    @EntityGraph(attributePaths = {"mentor"})
    Optional<StudentGroup> findByName(String name);

    Optional<StudentGroup> findByMentor(User mentor);

    boolean existsByName(String name);
}
