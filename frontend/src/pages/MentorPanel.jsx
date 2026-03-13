import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

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

/* ── tiny bar chart component ─────────────────────────────────── */
function MiniBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-gray-400 italic">No data yet</p>;
  }
  const max = Math.max(...Object.values(data), 1);
  const colors = [
    "bg-blue-500", "bg-indigo-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500",
  ];
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([label, count], i) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-24 text-xs text-gray-500 truncate text-right">{label}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${colors[i % colors.length]}`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-xs font-semibold text-gray-600 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

function MentorPanel() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState(null);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const act = async (id, action) => {
    setError("");
    setSuccess("");
    setActionId(id);
    try {
      const { data } = await api.put(`/complaints/${id}/${action}`);
      setComplaints((prev) => prev.map((c) => (c.id === id ? data : c)));
      setSuccess(`Complaint #${id} ${action === "approve" ? "approved" : "rejected"}.`);
      setTimeout(() => setSuccess(""), 4000);
      // Refresh stats
      const { data: newStats } = await api.get("/complaints/stats/mentor");
      setStats(newStats);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} complaint.`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Mentor Panel</h1>
          <Link to="/dashboard" className="text-sm text-blue-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ── Stats Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Assigned", value: stats?.total    ?? "–", icon: "📋", color: "text-gray-700",   bg: "bg-gray-50"   },
            { label: "Pending Review", value: stats?.pending  ?? "–", icon: "⏳", color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Approved",       value: stats?.approved ?? "–", icon: "✅", color: "text-blue-600",   bg: "bg-blue-50"   },
            { label: "Rejected",       value: stats?.rejected ?? "–", icon: "❌", color: "text-red-500",    bg: "bg-red-50"    },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl shadow-sm p-5 border border-gray-100`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
              </div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Category Breakdown ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Handled Complaints by Category</h2>
          <MiniBarChart data={stats?.byCategory} />
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* ── Complaints Table ────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Assigned Complaints</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-gray-500">No complaints to review at the moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Issue Type</th>
                    <th className="pb-3 pr-4">Location</th>
                    <th className="pb-3 pr-4">Priority</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 align-top">
                      <td className="py-3 pr-4 text-gray-400">{c.id}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800">{c.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{c.description}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{c.studentName}</td>
                      <td className="py-3 pr-4 text-gray-600">{c.issueType || c.category}</td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap text-xs">
                        {c.building ? (
                          <span>{c.building}, {c.floorNumber} Floor, Rm {c.roomNumber}</span>
                        ) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityStyles[c.priority]}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        {c.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => act(c.id, "approve")}
                              disabled={actionId === c.id}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => act(c.id, "reject")}
                              disabled={actionId === c.id}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition disabled:opacity-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MentorPanel;
