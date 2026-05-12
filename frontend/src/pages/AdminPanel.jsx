import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ComplaintDetailModal from "../components/ComplaintDetailModal";
import api from "../api/api";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  { bg: "color-mix(in srgb, #eab308 15%, transparent)", text: "#b45309", border: "#eab308" },
  APPROVED: { bg: "color-mix(in srgb, var(--primary) 15%, transparent)", text: "var(--primary)", border: "var(--primary)" },
  REJECTED: { bg: "color-mix(in srgb, var(--error) 15%, transparent)", text: "var(--error)", border: "var(--error)" },
  ASSIGNED: { bg: "color-mix(in srgb, #6366f1 15%, transparent)", text: "#4338ca", border: "#6366f1" },
  RESOLVED: { bg: "color-mix(in srgb, #16a34a 15%, transparent)", text: "#15803d", border: "#16a34a" },
  CLOSED:   { bg: "var(--surface-container-high)", text: "var(--on-surface-variant)", border: "var(--outline)" },
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/* ── Donut chart (Issue Type) ──────────────────────────────────── */
const DONUT_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#6366F1", "#EF4444", "#06B6D4", "#8B5CF6", "#EC4899"];

function IssueTypeDonut({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--on-surface-variant)" }}>No data yet</p>;
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
          <div key={label} className="flex items-center gap-2 text-sm" style={{ color: "var(--on-surface)" }}>
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
    return <p className="text-sm italic" style={{ color: "var(--on-surface-variant)" }}>No data yet</p>;
  }
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      {entries.map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-32 text-xs font-medium text-right shrink-0 truncate" style={{ color: "var(--on-surface)" }} title={label}>{label}</span>
          <div className="flex-1 h-6 rounded-md overflow-hidden relative" style={{ background: "var(--outline-variant)" }}>
            <div
              className="h-full rounded-md transition-all flex items-center justify-end pr-2"
              style={{ width: `${Math.max((count / max) * 100, 14)}%`, background: "var(--primary)" }}
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
          return <line key={frac} x1={padX} y1={y} x2={w - padX} y2={y} stroke="var(--outline-variant)" strokeWidth="1" />;
        })}
        <polyline fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {counts.map((v, i) => {
          const x = padX + i * stepX;
          const y = h - padY - ((v / max) * (h - 2 * padY));
          return <circle key={i} cx={x} cy={y} r="4" fill="var(--primary)" />;
        })}
      </svg>
      <div className="flex justify-between text-xs px-2 -mt-1" style={{ color: "var(--on-surface-variant)" }}>
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

/* ── Card wrapper ─────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

/* ── Clickable Complaint Row (opens modal) ────────────────────── */
function ComplaintRow({ complaint: c, onClick }) {
  const status = statusStyles[c.status] || statusStyles.CLOSED;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-all duration-200 hover:bg-[--surface-container-low] rounded-lg"
      style={{ borderBottom: "1px solid var(--outline-variant)" }}
    >
      <span className="text-xs font-mono shrink-0" style={{ color: "var(--on-surface-variant)" }} title={c.id}>#{String(c.id).slice(-6)}</span>

      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        title={c.priority}
        style={{
          background: c.priority === "HIGH" ? "var(--error)" : c.priority === "MEDIUM" ? "#f59e0b" : "var(--outline)",
        }}
      />

      <span className="flex-1 font-medium text-sm truncate" style={{ color: "var(--on-surface)" }}>
        {c.title}
      </span>

      <span className="hidden sm:inline text-xs shrink-0 max-w-30 truncate" style={{ color: "var(--on-surface-variant)" }}>
        {c.studentName}
      </span>

      <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
        {c.issueType || c.category}
      </span>

      <span
        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0"
        style={{ background: status.bg, color: status.text }}
      >
        {c.status}
      </span>

      <span className="hidden lg:inline text-[11px] shrink-0 w-20 text-right" style={{ color: "var(--on-surface-variant)" }}>
        {new Date(c.createdAt).toLocaleDateString()}
      </span>

      <span className="material-symbols-outlined text-lg shrink-0" style={{ color: "var(--on-surface-variant)" }}>
        chevron_right
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
function AdminPanel() {
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
    { label: "Total Complaints", value: stats?.total ?? "–", borderColor: "var(--primary)", icon: "description" },
    { label: "Pending", value: stats?.pending ?? "–", borderColor: "#eab308", icon: "pending" },
    { label: "Under Review", value: stats?.approved ?? "–", borderColor: "var(--error)", icon: "hourglass_empty" },
    { label: "Resolved", value: stats?.resolved ?? "–", borderColor: "#16a34a", icon: "task_alt" },
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
                background: "var(--surface-container-lowest)",
                border: "1px solid var(--outline-variant)",
                borderTop: `4px solid ${card.borderColor}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-xl" style={{ color: card.borderColor }}>
                  {card.icon}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>{card.label}</span>
              </div>
              <span className="text-4xl font-bold" style={{ color: "var(--on-surface)" }}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--on-surface)" }}>Complaints by Issue Type</h2>
            <IssueTypeDonut data={stats?.byIssueType} />
          </Card>
          <Card>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--on-surface)" }}>Complaints by Building</h2>
            <BuildingBarChart data={stats?.byBuilding} />
          </Card>
          <Card>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--on-surface)" }}>Complaint Activity Over Time</h2>
            <ActivityLineChart complaints={complaints} />
          </Card>
        </div>

        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, #16a34a 10%, transparent)", border: "1px solid #16a34a", color: "#15803d" }}>
            <span className="material-symbols-outlined">check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, var(--error) 10%, transparent)", border: "1px solid var(--error)", color: "var(--error)" }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* All Complaints */}
        <div className="rounded-xl shadow-sm" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                  All Complaints
                  <span className="text-sm font-normal ml-2" style={{ color: "var(--on-surface-variant)" }}>
                    {visible.length} of {complaints.length}
                  </span>
                </h2>
                <Link
                  to="/submit-complaint"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
                  style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}
                >
                  <span className="material-symbols-outlined text-base">add</span> New
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: "var(--on-surface-variant)" }}>search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search complaints…"
                    className="text-sm py-2 pl-10 pr-3 rounded-lg w-56 outline-none"
                    style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm py-2 px-3 rounded-lg outline-none cursor-pointer"
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
              {["ALL", "PENDING", "APPROVED", "ASSIGNED", "REJECTED", "RESOLVED", "CLOSED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer"
                  style={filter === f ? { background: "var(--primary-container)", color: "var(--on-primary-container)" } : { background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
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
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span className="text-sm">Loading complaints…</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: "var(--on-surface-variant)" }}>search_off</span>
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
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
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--on-surface)" }}>System Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>No recent activity.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    {["Date", "User", "Action", "Details"].map((h) => (
                      <th key={h} className="pb-3 pr-6 text-xs uppercase tracking-wide font-medium" style={{ color: "var(--on-surface-variant)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((a, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                      <td className="py-3 pr-6 whitespace-nowrap" style={{ color: "var(--on-surface-variant)" }}>
                        {new Date(a.date).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 pr-6" style={{ color: "var(--on-surface)" }}>{a.user}</td>
                      <td className="py-3 pr-6" style={{ color: "var(--on-surface-variant)" }}>{a.action}</td>
                      <td className="py-3" style={{ color: "var(--on-surface-variant)" }}>{a.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

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