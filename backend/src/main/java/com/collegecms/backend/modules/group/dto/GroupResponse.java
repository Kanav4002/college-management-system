package com.collegecms.backend.modules.group.dto;

import com.collegecms.backend.modules.group.entity.StudentGroup;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupResponse {

    private Long id;
    private String name;
    private String description;
    private Long mentorId;
    private String mentorName;
    private String mentorEmail;
    private long memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupResponse from(StudentGroup g, long memberCount) {
        GroupResponse r = new GroupResponse();
        r.setId(g.getId());
        r.setName(g.getName());
        r.setDescription(g.getDescription());
        if (g.getMentor() != null) {
            r.setMentorId(g.getMentor().getId());
            r.setMentorName(g.getMentor().getName());
            r.setMentorEmail(g.getMentor().getEmail());
        }
        r.setMemberCount(memberCount);
        r.setCreatedAt(g.getCreatedAt());
        r.setUpdatedAt(g.getUpdatedAt());
        return r;
    }
}
