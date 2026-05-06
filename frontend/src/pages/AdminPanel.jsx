import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import ComplaintDetailModal from "../components/ComplaintDetailModal";
import api from "../api/api";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED:   "bg-gray-200 text-gray-600",
};

const priorityStyles = {
  LOW:    "bg-gray-100 text-gray-600",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH:   "bg-red-100 text-red-600",
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/* ── Donut chart (Issue Type) ──────────────────────────────────── */
const DONUT_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#6366F1", "#EF4444", "#06B6D4", "#8B5CF6", "#EC4899"];

function IssueTypeDonut({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No data yet</p>;
  }
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  let cumulative = 0;
  const stops = entries.flatMap(([, count], i) => {
    const start = cumulative;
    cumulative += (count / total) * 100;
    const color = DONUT_COLORS[i % DONUT_COLORS.length];
    return [`${color} ${start}%`, `${color} ${cumulative}%`];
  });

  return (
    <div className="flex items-center justify-center gap-8">
      <div
        className="h-44 w-44 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${stops.join(", ")})`,
          mask: "radial-gradient(circle, transparent 42%, black 43%)",
          WebkitMask: "radial-gradient(circle, transparent 42%, black 43%)",
        }}
      />
      <div className="space-y-2">
        {entries.map(([label, count], i) => (
          <div key={label} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
            <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span>{label} ({Math.round((count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal bar chart (Complaints by Building) ────────────── */
function BuildingBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No data yet</p>;
  }
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      {entries.map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-32 text-xs font-medium text-right shrink-0 truncate" style={{ color: "var(--text-primary)" }} title={label}>{label}</span>
          <div className="flex-1 h-6 rounded-md overflow-hidden relative" style={{ background: "var(--chart-track)" }}>
            <div
              className="h-full rounded-md bg-(--accent) transition-all flex items-center justify-end pr-2"
              style={{ width: `${Math.max((count / max) * 100, 14)}%` }}
            >
              <span className="text-[11px] font-bold text-white">{count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Line chart (Activity Over Time) ───────────────────────────── */
function ActivityLineChart({ complaints }) {
  const now = new Date();
  const weeks = [];
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weeks.push({ start: weekStart, end: weekEnd });
  }

  const counts = weeks.map((w) =>
    complaints.filter((c) => {
      const d = new Date(c.createdAt);
      return d >= w.start && d < w.end;
    }).length
  );

  const max = Math.max(...counts, 1);
  const labels = ["4 wks", "3 wks", "2 wks", "Last wk", "This wk"];

  const w = 320, h = 140, padX = 10, padY = 10;
  const stepX = (w - 2 * padX) / (counts.length - 1 || 1);
  const points = counts.map((v, i) => {
    const x = padX + i * stepX;
    const y = h - padY - ((v / max) * (h - 2 * padY));
    return `${x},${y}`;
  }).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = h - padY - frac * (h - 2 * padY);
          return <line key={frac} x1={padX} y1={y} x2={w - padX} y2={y} stroke="var(--chart-track)" strokeWidth="1" />;
        })}
        <polyline fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {counts.map((v, i) => {
          const x = padX + i * stepX;
          const y = h - padY - ((v / max) * (h - 2 * padY));
          return <circle key={i} cx={x} cy={y} r="4" fill="var(--accent)" />;
        })}
      </svg>
      <div className="flex justify-between text-xs px-2 -mt-1" style={{ color: "var(--text-muted)" }}>
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

/* ── Card wrapper with glassmorphism ─────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
}

/* ── Clickable Complaint Row (opens modal) ────────────────────── */
function ComplaintRow({ complaint: c, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer glass-card transition-all duration-200 hover:scale-102"
    >
      {/* ID */}
      <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-muted)" }} title={c.id}>#{String(c.id).slice(-6)}</span>

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

      {/* Submitter */}
      <span className="hidden sm:inline text-xs shrink-0 max-w-30 truncate" style={{ color: "var(--text-secondary)" }}>
        {c.studentName}
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
function AdminPanel() {
  const { auth } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get("/complaints/all"),
        api.get("/complaints/stats/admin"),
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

  const handleAction = async (id, action, extra) => {
    setError(""); setSuccess(""); setActionId(id);
    try {
      let result;
      switch (action) {
        case "resolve":
          result = await api.put(`/complaints/${id}/resolve`);
          setComplaints((prev) => prev.map((c) => (c.id === id ? result.data : c)));
          setSelectedComplaint((prev) => (prev?.id === id ? result.data : prev));
          setSuccess(`Complaint #${id} resolved.`);
          break;
        case "close":
          result = await api.put(`/complaints/${id}/close`);
          setComplaints((prev) => prev.map((c) => (c.id === id ? result.data : c)));
          setSelectedComplaint((prev) => (prev?.id === id ? result.data : prev));
          setSuccess(`Complaint #${id} closed.`);
          break;
        case "assign":
          result = await api.put(`/complaints/${id}/assign`, { department: extra?.department });
          setComplaints((prev) => prev.map((c) => (c.id === id ? result.data : c)));
          setSelectedComplaint((prev) => (prev?.id === id ? result.data : prev));
          setSuccess(`Complaint #${id} assigned to ${extra?.department}.`);
          break;
        case "delete":
          await api.delete(`/complaints/${id}`);
          setComplaints((prev) => prev.filter((c) => c.id !== id));
          setSelectedComplaint(null);
          setSuccess(`Complaint #${id} deleted.`);
          break;
        default:
          return;
      }
      setTimeout(() => setSuccess(""), 4000);
      const { data: newStats } = await api.get("/complaints/stats/admin");
      setStats(newStats);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} complaint.`);
    } finally { setActionId(null); }
  };

  const counts = {
    ALL: complaints.length,
    PENDING: complaints.filter((c) => c.status === "PENDING").length,
    APPROVED: complaints.filter((c) => c.status === "APPROVED").length,
    ASSIGNED: complaints.filter((c) => c.status === "ASSIGNED").length,
    REJECTED: complaints.filter((c) => c.status === "REJECTED").length,
    RESOLVED: complaints.filter((c) => c.status === "RESOLVED").length,
    CLOSED: complaints.filter((c) => c.status === "CLOSED").length,
  };

  /* ── Filtered, searched, sorted complaints ──────────────────── */
  const visible = useMemo(() => {
    let list = filter === "ALL" ? [...complaints] : complaints.filter((c) => c.status === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.studentName?.toLowerCase().includes(q) ||
        c.mentorName?.toLowerCase().includes(q) ||
        c.building?.toLowerCase().includes(q) ||
        c.issueType?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.assignedDepartment?.toLowerCase().includes(q) ||
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

  const recentActivity = complaints.slice(0, 10).map((c) => {
    let action = "New Complaint";
    let details = `Submitted ${c.issueType || c.category} issue${c.building ? ` in ${c.building}` : ""}`;
    if (c.status === "RESOLVED") { action = "Resolved"; details = `Complaint #${c.id} (${c.category}) marked as Resolved`; }
    else if (c.status === "APPROVED") { action = "Status Update"; details = `Complaint #${c.id} marked as Approved`; }
    else if (c.status === "ASSIGNED") { action = "Auto-Routed"; details = `Complaint #${c.id} assigned to ${c.assignedDepartment || "department"}`; }
    else if (c.status === "REJECTED") { action = "Status Update"; details = `Complaint #${c.id} marked as Rejected`; }
    return { date: c.updatedAt || c.createdAt, user: c.status === "PENDING" ? c.studentName : (c.mentorName || "Admin User"), action, details };
  });

  const statCards = [
    { label: "Total Complaints", value: stats?.total ?? "–", borderColor: "var(--accent)",
      icon: <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: "Pending", value: stats?.pending ?? "–", borderColor: "#eab308",
      icon: <svg className="w-5 h-5" style={{ color: "#eab308" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Under Review", value: stats?.approved ?? "–", borderColor: "#ef4444",
      icon: <svg className="w-5 h-5" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: "Resolved", value: stats?.resolved ?? "–", borderColor: "#22c55e",
      icon: <svg className="w-5 h-5" style={{ color: "#22c55e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <AppShell title="Admin Analytics Dashboard">
      <main className="max-w-7xl mx-auto px-2 pb-6 pt-2 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-5 shadow-sm"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderTop: `4px solid ${card.borderColor}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {card.icon}
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{card.label}</span>
              </div>
              <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Complaints by Issue Type</h2>
            <IssueTypeDonut data={stats?.byIssueType} />
          </Card>
          <Card>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Complaints by Building</h2>
            <BuildingBarChart data={stats?.byBuilding} />
          </Card>
          <Card>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Complaint Activity Over Time</h2>
            <ActivityLineChart complaints={complaints} />
          </Card>
        </div>

        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* ═══ All Complaints ═══════════════════════════════════ */}
        <div
          className="rounded-xl shadow-sm"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Header with title, search, sort, filters */}
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  All Complaints
                  <span className="text-sm font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                    {visible.length} of {complaints.length}
                  </span>
                </h2>
                <Link
                  to="/submit-complaint"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--accent) text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
                >
                  <span className="text-sm leading-none">+</span> New
                </Link>
              </div>

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
                    className="text-sm py-2 pl-9 pr-3 rounded-lg w-56 outline-none focus:ring-2 focus:ring-(--accent)/30 transition"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm py-2 px-3 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-(--accent)/30 transition"
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
              {["ALL", "PENDING", "APPROVED", "ASSIGNED", "REJECTED", "RESOLVED", "CLOSED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer ${
                    filter === f ? "bg-(--accent) text-white" : ""
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
                  {search ? `No complaints matching "${search}"` : "No complaints in this category."}
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

        {/* System Activity */}
        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>System Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No recent activity.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Date", "User", "Action", "Details"].map((h) => (
                      <th key={h} className="pb-3 pr-6 text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((a, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-3 pr-6 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {new Date(a.date).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 pr-6" style={{ color: "var(--text-primary)" }}>{a.user}</td>
                      <td className="py-3 pr-6" style={{ color: "var(--text-secondary)" }}>{a.action}</td>
                      <td className="py-3" style={{ color: "var(--text-secondary)" }}>{a.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          role="ADMIN"
          onAction={handleAction}
          acting={actionId === selectedComplaint.id}
        />
      )}
    </AppShell>
  );
}

export default AdminPanel;
