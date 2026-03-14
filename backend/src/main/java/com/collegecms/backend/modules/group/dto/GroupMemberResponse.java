package com.collegecms.backend.modules.group.dto;

import com.collegecms.backend.modules.user.entity.User;
import lombok.Data;

@Data
public class GroupMemberResponse {

    private Long id;
    private String name;
    private String email;
    private String role;

    public static GroupMemberResponse from(User u) {
        GroupMemberResponse r = new GroupMemberResponse();
        r.setId(u.getId());
        r.setName(u.getName());
        r.setEmail(u.getEmail());
        r.setRole(u.getRole().name());
        return r;
    }
}
