package com.collegecms.backend.modules.group.entity;

import com.collegecms.backend.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_groups")
@Getter
@Setter
public class StudentGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display name — e.g. "Computer Science Year 1" */
    @Column(nullable = false, unique = true)
    private String name;

    /** Optional longer description */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** The mentor assigned to this group (one mentor per group). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id")
    private User mentor;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
