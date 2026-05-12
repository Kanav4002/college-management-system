import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import ComplaintDetailModal from "../components/ComplaintDetailModal";
import api from "../api/api";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  { bg: "color-mix(in srgb, #f59e0b 15%, transparent)", color: "#f59e0b", border: "#f59e0b" },
  APPROVED: { bg: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)", border: "var(--primary)" },
  REJECTED: { bg: "color-mix(in srgb, var(--error) 15%, transparent)", color: "var(--error)", border: "var(--error)" },
  ASSIGNED: { bg: "color-mix(in srgb, #8b5cf6 15%, transparent)", color: "#8b5cf6", border: "#8b5cf6" },
  RESOLVED: { bg: "color-mix(in srgb, #22c55e 15%, transparent)", color: "#22c55e", border: "#22c55e" },
  CLOSED:   { bg: "var(--surface-container-high)", color: "var(--on-surface-variant)", border: "var(--outline-variant)" },
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/* ── Horizontal bar chart with count inside bars ──────────────── */
function CategoryBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--on-surface-variant)" }}>No data yet</p>;
  }
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      {entries.map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-28 text-sm font-medium text-right shrink-0" style={{ color: "var(--on-surface)" }}>{label}</span>
          <div className="flex-1 h-7 rounded-md overflow-hidden relative" style={{ background: "var(--surface-container-high)" }}>
            <div
              className="h-full rounded-md flex items-center justify-end pr-2 transition-all"
              style={{
                width: `${Math.max((count / max) * 100, 12)}%`,
                background: "var(--primary)",
              }}
            >
              <span className="text-xs font-bold text-white">{count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Card helper ──────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

/* ── Clickable Complaint Row (opens modal) ────────────────────── */
function ComplaintRow({ complaint: c, onClick }) {
  const s = statusStyles[c.status] || statusStyles.CLOSED;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer card transition-all duration-200"
      style={{ padding: "12px 16px" }}
    >
      {/* ID */}
      <span className="text-xs font-mono shrink-0" style={{ color: "var(--on-surface-variant)" }} title={c.id}>#{String(c.id).slice(-6)}</span>

      {/* Priority dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        title={c.priority}
        style={{
          background: c.priority === "HIGH" ? "#ef4444" : c.priority === "MEDIUM" ? "#f59e0b" : "#9ca3af",
        }}
      />

      {/* Title */}
      <span className="flex-1 font-medium text-sm truncate" style={{ color: "var(--on-surface)" }}>
        {c.title}
      </span>

      {/* Issue Type badge */}
      <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0" style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}>
        {c.issueType || c.category}
      </span>

      {/* Status badge */}
      <span
        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0"
        style={{ background: s.bg, color: s.color }}
      >
        {c.status}
      </span>

      {/* Date */}
      <span className="hidden lg:inline text-[11px] shrink-0 w-20 text-right" style={{ color: "var(--on-surface-variant)" }}>
        {new Date(c.createdAt).toLocaleDateString()}
      </span>

      {/* View indicator arrow */}
      <span className="material-symbols-outlined text-base shrink-0" style={{ color: "var(--on-surface-variant)" }}>
        chevron_right
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
function StudentPanel() {
  const { auth } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get("/complaints/my"),
        api.get("/complaints/stats/student"),
      ]);
      setComplaints(complaintsRes.data);
      setStats(statsRes.data);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll for updates so student sees mentor actions in near-real-time.
  useEffect(() => {
    const id = setInterval(() => fetchData(), 6000);
    return () => clearInterval(id);
  }, [fetchData]);

  const counts = {
    ALL: complaints.length,
    PENDING: complaints.filter((c) => c.status === "PENDING").length,
    APPROVED: complaints.filter((c) => c.status === "APPROVED").length,
    REJECTED: complaints.filter((c) => c.status === "REJECTED").length,
    RESOLVED: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  const visible = useMemo(() => {
    let list = filter === "ALL" ? [...complaints] : complaints.filter((c) => c.status === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.building?.toLowerCase().includes(q) ||
        c.issueType?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    }

    switch (sortBy) {
      case "newest":
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "priority":
        list.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        break;
    }

    return list;
  }, [complaints, filter, search, sortBy]);

  const statCards = [
    {
      label: "Total Submitted",
      value: stats?.total ?? "–",
      subtitle: "Complaints submitted",
      icon: "description",
      valueColor: "var(--primary)",
    },
    {
      label: "Pending",
      value: stats?.pending ?? "–",
      subtitle: "Awaiting action",
      icon: "pending",
      valueColor: "#f59e0b",
    },
    {
      label: "Resolved",
      value: stats?.resolved ?? "–",
      subtitle: "Successfully resolved",
      icon: "task_alt",
      valueColor: "#22c55e",
    },
  ];

  return (
    <AppShell title="Student Personal Dashboard">
      <main className="max-w-7xl mx-auto px-2 pb-6 pt-2 space-y-8">
        {/* Stat Cards — 3 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {statCards.map((card) => (
            <Card key={card.label}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-xl" style={{ color: card.valueColor }}>
                  {card.icon}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{card.label}</span>
              </div>
              <p className="text-4xl font-bold mb-1" style={{ color: card.valueColor }}>{card.value}</p>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{card.subtitle}</p>
            </Card>
          ))}
        </div>

        {/* Category Breakdown + New Complaint button */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Complaints by Category</h2>
            <Link
              to="/submit-complaint"
              className="btn-primary inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-base">add</span> New Complaint
            </Link>
          </div>
          <CategoryBarChart data={stats?.byCategory} />
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--error-container)", color: "var(--on-error-container)" }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* ═══ My Complaints ═══════════════════════════════════ */}
        <div className="rounded-xl" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
          {/* Header with title, search, sort, filters */}
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                My Complaints
                <span className="text-sm font-normal ml-2" style={{ color: "var(--on-surface-variant)" }}>
                  {visible.length} of {complaints.length}
                </span>
              </h2>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <span className="material-symbols-outlined w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: "var(--on-surface-variant)" }}>
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search complaints…"
                    className="text-sm py-2 pl-9 pr-3 rounded-lg outline-none transition"
                    style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm py-2 px-3 rounded-lg outline-none cursor-pointer transition"
                  style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="priority">Priority (High → Low)</option>
                  <option value="status">Status (A → Z)</option>
                </select>
              </div>
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap">
              {["ALL", "PENDING", "APPROVED", "REJECTED", "RESOLVED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer"
                  style={filter === f ? { background: "var(--primary)", color: "white" } : { background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
                >
                  {f} ({counts[f]})
                </button>
              ))}
            </div>
          </div>

          {/* Complaint rows */}
          <div className="px-5 pb-5">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3" style={{ color: "var(--on-surface-variant)" }}>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                <span className="text-sm">Loading complaints…</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined w-12 h-12 mx-auto mb-3 text-base" style={{ color: "var(--on-surface-variant)" }}>
                  search_off
                </span>
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  {search ? `No complaints matching "${search}"` : "No complaints yet. Submit one above."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((c) => (
                  <ComplaintRow
                    key={c.id}
                    complaint={c}
                    onClick={() => setSelectedComplaint(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          role="STUDENT"
        />
      )}
    </AppShell>
  );
}

export default StudentPanel;