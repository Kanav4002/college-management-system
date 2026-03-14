import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../api/api";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  RESOLVED: "bg-green-100 text-green-700",
};

const priorityStyles = {
  LOW:    "bg-gray-100 text-gray-600",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH:   "bg-red-100 text-red-600",
};

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

/* ── Bar chart (Complaints by Building) ────────────────────────── */
function BuildingBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No data yet</p>;
  }
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end justify-around gap-4 h-52 pt-4">
      {entries.map(([label, count]) => (
        <div key={label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{count}</span>
          <div className="w-full max-w-[48px] rounded-t-md bg-[#0088D1] transition-all" style={{ height: `${(count / max) * 160}px` }} />
          <span className="text-xs text-center leading-tight mt-1 truncate w-full" style={{ color: "var(--text-secondary)" }}>{label}</span>
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
        <polyline fill="none" stroke="#0088D1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {counts.map((v, i) => {
          const x = padX + i * stepX;
          const y = h - padY - ((v / max) * (h - 2 * padY));
          return <circle key={i} cx={x} cy={y} r="4" fill="#0088D1" />;
        })}
      </svg>
      <div className="flex justify-between text-xs px-2 -mt-1" style={{ color: "var(--text-muted)" }}>
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

/* ── Card wrapper that respects theme ─────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl shadow-sm p-6 ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
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

  const resolve = async (id) => {
    setError(""); setSuccess(""); setActionId(id);
    try {
      const { data } = await api.put(`/complaints/${id}/resolve`);
      setComplaints((prev) => prev.map((c) => (c.id === id ? data : c)));
      setSuccess(`Complaint #${id} resolved.`);
      setTimeout(() => setSuccess(""), 4000);
      const { data: newStats } = await api.get("/complaints/stats/admin");
      setStats(newStats);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve complaint.");
    } finally { setActionId(null); }
  };

  const counts = {
    ALL: complaints.length,
    PENDING: complaints.filter((c) => c.status === "PENDING").length,
    APPROVED: complaints.filter((c) => c.status === "APPROVED").length,
    REJECTED: complaints.filter((c) => c.status === "REJECTED").length,
    RESOLVED: complaints.filter((c) => c.status === "RESOLVED").length,
  };
  const visible = filter === "ALL" ? complaints : complaints.filter((c) => c.status === filter);

  const recentActivity = complaints.slice(0, 10).map((c) => {
    let action = "New Complaint";
    let details = `Submitted ${c.issueType || c.category} issue${c.building ? ` in ${c.building}` : ""}`;
    if (c.status === "RESOLVED") { action = "Resolved"; details = `Complaint #${c.id} (${c.category}) marked as Resolved`; }
    else if (c.status === "APPROVED") { action = "Status Update"; details = `Complaint #${c.id} marked as Approved`; }
    else if (c.status === "REJECTED") { action = "Status Update"; details = `Complaint #${c.id} marked as Rejected`; }
    return { date: c.updatedAt || c.createdAt, user: c.status === "PENDING" ? c.studentName : (c.mentorName || "Admin User"), action, details };
  });

  const statCards = [
    { label: "Total Complaints", value: stats?.total ?? "–", borderColor: "#0088D1",
      icon: <svg className="w-5 h-5" style={{ color: "#0088D1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: "Pending", value: stats?.pending ?? "–", borderColor: "#eab308",
      icon: <svg className="w-5 h-5" style={{ color: "#eab308" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Under Review", value: stats?.approved ?? "–", borderColor: "#ef4444",
      icon: <svg className="w-5 h-5" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: "Resolved", value: stats?.resolved ?? "–", borderColor: "#22c55e",
      icon: <svg className="w-5 h-5" style={{ color: "#22c55e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <Navbar title="Admin Analytics Dashboard" showBack />

      <main className="max-w-7xl mx-auto px-6 pb-12 pt-6 space-y-6">
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
        {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>}
        {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {/* All Complaints Table */}
        <div className="rounded-xl shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-5 pb-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>All Complaints</h2>
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

          {loading ? (
            <p className="text-sm px-5 pb-5" style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-sm px-5 pb-5" style={{ color: "var(--text-muted)" }}>No complaints in this category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border)" }}>
                    {["#", "Title", "Student", "Mentor", "Issue Type", "Location", "Priority", "Status", "Date", "Action"].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c.id} className="align-middle" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-2.5 px-3" style={{ color: "var(--text-muted)" }}>{c.id}</td>
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{c.title}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{c.description}</p>
                      </td>
                      <td className="py-2.5 px-3" style={{ color: "var(--text-secondary)" }}>{c.studentName}</td>
                      <td className="py-2.5 px-3" style={{ color: "var(--text-secondary)" }}>{c.mentorName || "—"}</td>
                      <td className="py-2.5 px-3" style={{ color: "var(--text-secondary)" }}>{c.issueType || c.category}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-xs" style={{ color: "var(--text-secondary)" }}>
                        {c.building ? `${c.building}, ${c.floorNumber} Fl, Rm ${c.roomNumber}` : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${priorityStyles[c.priority]}`}>{c.priority}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${statusStyles[c.status]}`}>{c.status}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {c.status === "APPROVED" ? (
                          <button onClick={() => resolve(c.id)} disabled={actionId === c.id} className="px-2.5 py-1 bg-green-600 text-white text-[11px] font-semibold rounded hover:bg-green-700 transition disabled:opacity-50 cursor-pointer">Resolve</button>
                        ) : (
                          <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>{c.status === "RESOLVED" ? "Closed" : "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    </div>
  );
}

export default AdminPanel;
