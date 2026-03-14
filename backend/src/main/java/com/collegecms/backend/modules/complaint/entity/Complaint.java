package com.collegecms.backend.modules.complaint.entity;

import com.collegecms.backend.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Getter
@Setter
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    /** Structured issue type (e.g. Electrical, Plumbing, IT, Cleaning …) */
    @Column(nullable = false)
    private String issueType;

    /** Campus building where the problem exists */
    @Column(nullable = false)
    private String building;

    /** Floor number inside the building */
    @Column(nullable = false)
    private String floorNumber;

    /** Room number / identifier */
    @Column(nullable = false)
    private String roomNumber;

    /** When the problem started (reported by the submitter) */
    private LocalDateTime problemStartedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status;

    /**
     * The user who submitted the complaint.
     * For student complaints this is the student; for mentor complaints
     * this is the mentor who filed it.  Nullable = true so the existing
     * NOT-NULL DB constraint can be relaxed via ALTER TABLE.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    /** Populated when a mentor approves or rejects a student complaint. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id")
    private User mentor;

    /**
     * Department a mentor complaint is auto-routed to.
     * NULL for student complaints (they go through mentor approval instead).
     */
    private String assignedDepartment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
