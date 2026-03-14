import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../api/api";

/* ── Style maps ───────────────────────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  RESOLVED: "bg-green-100 text-green-700",
};
const statusLabels = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED", RESOLVED: "RESOLVED" };

const priorityStyles = {
  LOW:    "bg-gray-200 text-gray-700",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH:   "bg-red-100 text-red-600",
};

/* ── Horizontal bar chart ─────────────────────────────────────── */
function HorizontalBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No data yet</p>;
  }
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-4">
      {entries.map(([label, count]) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{count}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--chart-track)" }}>
            <div className="h-full rounded-full bg-[#0088D1] transition-all" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Detail modal ─────────────────────────────────────────────── */
function DetailModal({ complaint, onClose }) {
  if (!complaint) return null;
  const c = complaint;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Complaint Details</h3>
          <button onClick={onClose} className="text-xl cursor-pointer" style={{ color: "var(--text-muted)" }}>&times;</button>
        </div>
        <div className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Title:</span> {c.title}</div>
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Description:</span> {c.description}</div>
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Student:</span> {c.studentName} ({c.studentEmail})</div>
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Issue Type:</span> {c.issueType || "—"}</div>
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Category:</span> {c.category}</div>
          <div>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Location:</span>{" "}
            {c.building ? `${c.building}, ${c.floorNumber} Floor, Rm ${c.roomNumber}` : "N/A"}
          </div>
          {c.problemStartedAt && (
            <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Problem Started:</span> {new Date(c.problemStartedAt).toLocaleString()}</div>
          )}
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Priority:</span> {c.priority}</div>
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Status:</span> {c.status}</div>
          <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Created:</span> {new Date(c.createdAt).toLocaleString()}</div>
          {c.updatedAt && <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Updated:</span> {new Date(c.updatedAt).toLocaleString()}</div>}
          {c.mentorName && <div><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Mentor:</span> {c.mentorName}</div>}
        </div>
      </div>
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

/* ═══════════════════════════════════════════════════════════════ */
function MentorPanel() {
  const { auth } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detailComplaint, setDetailComplaint] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get("/complaints/assigned"),
        api.get("/complaints/stats/mentor"),
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

  const act = async (id, action) => {
    setError(""); setSuccess(""); setActionId(id);
    try {
      const { data } = await api.put(`/complaints/${id}/${action}`);
      setComplaints((prev) => prev.map((c) => (c.id === id ? data : c)));
      setSuccess(`Complaint #${id} ${action === "approve" ? "approved" : "rejected"}.`);
      setTimeout(() => setSuccess(""), 4000);
      const { data: newStats } = await api.get("/complaints/stats/mentor");
      setStats(newStats);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} complaint.`);
    } finally { setActionId(null); }
  };

  const statCards = [
    { label: "Total Assigned", value: stats?.total ?? "–", iconBg: "#0088D1",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: "Pending Review", value: stats?.pending ?? "–", iconBg: "#eab308",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Approved", value: stats?.approved ?? "–", iconBg: "#22c55e",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Rejected", value: stats?.rejected ?? "–", iconBg: "#ef4444",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <Navbar title="Mentor Assignment Panel" showBack />

      <main className="max-w-7xl mx-auto px-6 pb-12 pt-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl p-5 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ background: card.iconBg }}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{card.label}</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Handled Complaints by Category</h2>
          <HorizontalBarChart data={stats?.byCategory} />
        </Card>

        {/* Alerts */}
        {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>}
        {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {/* Assigned Complaints Table */}
        <div className="rounded-xl shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Assigned Complaints</h2>
          </div>
          {loading ? (
            <p className="text-sm px-5 pb-5" style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : complaints.length === 0 ? (
            <p className="text-sm px-5 pb-5" style={{ color: "var(--text-muted)" }}>No complaints to review at the moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border)" }}>
                    {["#", "Title", "Student", "Issue Type", "Location", "Priority", "Status", "Date", "Action"].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id} className="align-middle" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-2.5 px-3" style={{ color: "var(--text-muted)" }}>{c.id}</td>
                      <td className="py-2.5 px-3 font-medium max-w-[160px]" style={{ color: "var(--text-primary)" }}>{c.title}</td>
                      <td className="py-2.5 px-3" style={{ color: "var(--text-secondary)" }}>{c.studentName}</td>
                      <td className="py-2.5 px-3" style={{ color: "var(--text-secondary)" }}>{c.issueType || c.category}</td>
                      <td className="py-2.5 px-3 text-xs whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                        {c.building ? `${c.building}, ${c.floorNumber} Fl, Rm ${c.roomNumber}` : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${priorityStyles[c.priority]}`}>{c.priority}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${statusStyles[c.status]}`}>{statusLabels[c.status]}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {c.status === "PENDING" && (
                            <>
                              <button onClick={() => act(c.id, "approve")} disabled={actionId === c.id} className="px-2 py-1 bg-green-500 text-white text-[11px] font-semibold rounded hover:bg-green-600 transition disabled:opacity-50 cursor-pointer">Approve</button>
                              <button onClick={() => act(c.id, "reject")} disabled={actionId === c.id} className="px-2 py-1 bg-red-500 text-white text-[11px] font-semibold rounded hover:bg-red-600 transition disabled:opacity-50 cursor-pointer">Reject</button>
                            </>
                          )}
                          <button onClick={() => setDetailComplaint(c)} className="px-2 py-1 bg-[#0088D1] text-white text-[11px] font-semibold rounded hover:opacity-90 transition cursor-pointer">Details</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {detailComplaint && <DetailModal complaint={detailComplaint} onClose={() => setDetailComplaint(null)} />}
    </div>
  );
}

export default MentorPanel;
