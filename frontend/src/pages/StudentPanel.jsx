import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ComplaintDetailModal from "../components/ComplaintDetailModal";
import api from "../api/api";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-orange-100 text-orange-600",
  APPROVED: "bg-blue-100 text-blue-600",
  REJECTED: "bg-red-100 text-red-600",
  ASSIGNED: "bg-indigo-100 text-indigo-600",
  RESOLVED: "bg-green-100 text-green-600",
};

const priorityStyles = {
  LOW:    "bg-gray-100 text-gray-600",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH:   "bg-red-100 text-red-600",
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/* ── Horizontal bar chart with count inside bars ──────────────── */
function CategoryBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No data yet</p>;
  }
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      {entries.map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-28 text-sm font-medium text-right shrink-0" style={{ color: "var(--text-primary)" }}>{label}</span>
          <div className="flex-1 h-7 rounded-md overflow-hidden relative" style={{ background: "var(--chart-track)" }}>
            <div
              className="h-full rounded-md bg-[#0088D1] transition-all flex items-center justify-end pr-2"
              style={{ width: `${Math.max((count / max) * 100, 12)}%` }}
            >
              <span className="text-xs font-bold text-white">{count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Card helper ──────────────────────────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl shadow-sm p-6 ${className}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

/* ── Clickable Complaint Row (opens modal) ────────────────────── */
function ComplaintRow({ complaint: c, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer rounded-xl transition-all duration-150 hover:shadow-md"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* ID */}
      <span className="text-xs font-mono w-8 shrink-0" style={{ color: "var(--text-muted)" }}>#{c.id}</span>

      {/* Priority dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        title={c.priority}
        style={{
          background: c.priority === "HIGH" ? "#ef4444" : c.priority === "MEDIUM" ? "#f59e0b" : "#9ca3af",
        }}
      />

      {/* Title */}
      <span className="flex-1 font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
        {c.title}
      </span>

      {/* Issue Type badge */}
      <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
        {c.issueType || c.category}
      </span>

      {/* Status badge */}
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${statusStyles[c.status]}`}>
        {c.status}
      </span>

      {/* Date */}
      <span className="hidden lg:inline text-[11px] shrink-0 w-20 text-right" style={{ color: "var(--text-muted)" }}>
        {new Date(c.createdAt).toLocaleDateString()}
      </span>

      {/* View indicator arrow */}
      <svg
        className="w-4 h-4 shrink-0"
        style={{ color: "var(--text-muted)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
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
      label: "Total Submitted", value: stats?.total ?? "–", subtitle: "Complaints submitted",
      icon: <svg className="w-6 h-6" style={{ color: "#0088D1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      valueColor: "#0088D1",
    },
    {
      label: "Pending", value: stats?.pending ?? "–", subtitle: "Awaiting action",
      icon: <svg className="w-6 h-6" style={{ color: "#eab308" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      valueColor: "#eab308",
    },
    {
      label: "Resolved", value: stats?.resolved ?? "–", subtitle: "Successfully resolved",
      icon: <svg className="w-6 h-6" style={{ color: "#22c55e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      valueColor: "#22c55e",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <Navbar title="Student Personal Dashboard" showBack />

      <main className="max-w-7xl mx-auto px-6 pb-12 pt-6 space-y-8">
        {/* Stat Cards — 3 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {statCards.map((card) => (
            <Card key={card.label}>
              <div className="flex items-center gap-2 mb-3">
                {card.icon}
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{card.label}</span>
              </div>
              <p className="text-4xl font-bold mb-1" style={{ color: card.valueColor }}>{card.value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{card.subtitle}</p>
            </Card>
          ))}
        </div>

        {/* Category Breakdown + New Complaint button */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Complaints by Category</h2>
            <Link
              to="/submit-complaint"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0088D1] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
            >
              <span className="text-lg leading-none">+</span> New Complaint
            </Link>
          </div>
          <CategoryBarChart data={stats?.byCategory} />
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* ═══ My Complaints ═══════════════════════════════════ */}
        <div
          className="rounded-xl shadow-sm"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Header with title, search, sort, filters */}
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                My Complaints
                <span className="text-sm font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                  {visible.length} of {complaints.length}
                </span>
              </h2>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search complaints…"
                    className="text-sm py-2 pl-9 pr-3 rounded-lg w-56 outline-none focus:ring-2 focus:ring-[#0088D1]/30 transition"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm py-2 px-3 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-[#0088D1]/30 transition"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
                  className={`px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer ${
                    filter === f ? "bg-[#0088D1] text-white" : ""
                  }`}
                  style={filter !== f ? { background: "var(--bg-input)", color: "var(--text-secondary)" } : {}}
                >
                  {f} ({counts[f]})
                </button>
              ))}
            </div>
          </div>

          {/* Complaint rows */}
          <div className="px-5 pb-5">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3" style={{ color: "var(--text-muted)" }}>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Loading complaints…</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
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
    </div>
  );
}

export default StudentPanel;
