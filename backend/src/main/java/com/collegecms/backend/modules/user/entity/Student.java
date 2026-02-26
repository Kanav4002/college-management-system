package com.collegecms.backend.modules.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "students")
@Getter
@Setter
public class Student {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id", nullable = false)
    private User user;

    @Column(unique = true, nullable = false)
    private String rollNo;

    @Column(nullable = false)
    private String branch;   // CSE, BBA, etc.

    
}