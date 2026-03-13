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

    // ── Category breakdown (label → count) ─────────────────────
    private Map<String, Long> byCategory;

    // ── Admin-specific ──────────────────────────────────────────
    private Double avgResolutionHours;
}
