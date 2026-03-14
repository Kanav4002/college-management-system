package com.collegecms.backend.modules.user.repository;

import com.collegecms.backend.modules.group.entity.StudentGroup;
import com.collegecms.backend.modules.user.entity.Role;
import com.collegecms.backend.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"group"})
    Optional<User> findByEmail(String email);

    /** All members of a group, ordered by role then name. */
    List<User> findByGroupOrderByRoleAscNameAsc(StudentGroup group);

    /** Count members in a group. */
    long countByGroup(StudentGroup group);

    /** Find all users with a given role (e.g. all mentors). */
    List<User> findByRoleOrderByNameAsc(Role role);

    /** Users not yet assigned to any group. */
    List<User> findByGroupIsNullAndRoleOrderByNameAsc(Role role);
}
