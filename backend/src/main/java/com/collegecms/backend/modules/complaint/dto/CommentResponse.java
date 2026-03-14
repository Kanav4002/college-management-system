package com.collegecms.backend.modules.complaint.dto;

import com.collegecms.backend.modules.complaint.entity.ComplaintComment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentResponse {

    private Long id;
    private Long complaintId;
    private String authorName;
    private String authorEmail;
    private String authorRole;
    private String content;
    private LocalDateTime createdAt;

    public static CommentResponse from(ComplaintComment comment) {
        CommentResponse r = new CommentResponse();
        r.setId(comment.getId());
        r.setComplaintId(comment.getComplaint().getId());
        if (comment.getAuthor() != null) {
            r.setAuthorName(comment.getAuthor().getName());
            r.setAuthorEmail(comment.getAuthor().getEmail());
            r.setAuthorRole(comment.getAuthor().getRole().name());
        }
        r.setContent(comment.getContent());
        r.setCreatedAt(comment.getCreatedAt());
        return r;
    }
}
