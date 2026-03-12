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

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "RESOLVED"];

function AdminPanel() {
  const [complaints, setComplaints]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionId, setActionId]       = useState(null);
  const [filter, setFilter]           = useState("ALL");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  const fetchComplaints = useCallback(async () => {
    try {
      const { data } = await api.get("/complaints/all");
      setComplaints(data);
    } catch {
      setError("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const resolve = async (id) => {
    setError("");
    setSuccess("");
    setActionId(id);
    try {
      const { data } = await api.put(`/complaints/${id}/resolve`);
      setComplaints((prev) => prev.map((c) => (c.id === id ? data : c)));
      setSuccess(`Complaint #${id} resolved.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve complaint.");
    } finally {
      setActionId(null);
    }
  };

  const counts = {
    ALL:      complaints.length,
    PENDING:  complaints.filter((c) => c.status === "PENDING").length,
    APPROVED: complaints.filter((c) => c.status === "APPROVED").length,
    REJECTED: complaints.filter((c) => c.status === "REJECTED").length,
    RESOLVED: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  const visible =
    filter === "ALL" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Admin Panel</h1>
          <Link to="/dashboard" className="text-sm text-blue-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Total",    value: counts.ALL,      color: "text-gray-700"   },
            { label: "Pending",  value: counts.PENDING,  color: "text-yellow-500" },
            { label: "Approved", value: counts.APPROVED, color: "text-blue-600"   },
            { label: "Resolved", value: counts.RESOLVED, color: "text-green-600"  },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
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

        {/* Complaints Table */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800">All Complaints</h2>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f} ({counts[f]})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-gray-500">No complaints in this category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Mentor</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Priority</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 align-top">
                      <td className="py-3 pr-4 text-gray-400">{c.id}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800">{c.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{c.description}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{c.studentName}</td>
                      <td className="py-3 pr-4 text-gray-600">{c.mentorName || "—"}</td>
                      <td className="py-3 pr-4 text-gray-600">{c.category}</td>
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
                        {c.status === "APPROVED" ? (
                          <button
                            onClick={() => resolve(c.id)}
                            disabled={actionId === c.id}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            {c.status === "RESOLVED" ? "Closed" : "—"}
                          </span>
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

export default AdminPanel;
