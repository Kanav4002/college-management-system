package com.collegecms.backend.modules.complaint.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ComplaintStatsResponse {

    // ── Common ──────────────────────────────────────────────────
    private long total;
    private long pending;
    private long approved;
    private long rejected;
    private long resolved;

    // ── Breakdowns (label → count) ──────────────────────────────
    private Map<String, Long> byCategory;
    private Map<String, Long> byIssueType;
    private Map<String, Long> byBuilding;

    // ── Admin-specific ──────────────────────────────────────────
    private Double avgResolutionHours;
}
