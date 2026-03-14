import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../api/api";

/* ── Status badge styles ──────────────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-orange-100 text-orange-600",
  APPROVED: "bg-blue-100 text-blue-600",
  REJECTED: "bg-red-100 text-red-600",
  RESOLVED: "bg-green-100 text-green-600",
};

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

/* ═══════════════════════════════════════════════════════════════ */
function StudentPanel() {
  const { auth } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {/* Recent Complaints Table */}
        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Recent Complaints</h2>
          {loading ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : complaints.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No complaints yet. Submit one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border)" }}>
                    {["ID", "Issue Type", "Location", "Status", "Date"].map((h) => (
                      <th key={h} className="py-3 px-4 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-3 px-4 font-medium" style={{ color: "var(--text-primary)" }}>#{c.id}</td>
                      <td className="py-3 px-4" style={{ color: "var(--text-primary)" }}>{c.issueType || c.title}</td>
                      <td className="py-3 px-4" style={{ color: "var(--text-secondary)" }}>
                        {c.building ? `${c.roomNumber ? "Room " + c.roomNumber : c.building}` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[c.status]}`}>
                          {c.status === "PENDING" ? "Pending" : c.status === "RESOLVED" ? "Resolved" : c.status === "APPROVED" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
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

export default StudentPanel;
