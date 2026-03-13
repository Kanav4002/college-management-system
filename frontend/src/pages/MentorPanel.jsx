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

function MentorPanel() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState(null); // id of complaint being acted on
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const fetchComplaints = useCallback(async () => {
    try {
      const { data } = await api.get("/complaints/assigned");
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

  const act = async (id, action) => {
    setError("");
    setSuccess("");
    setActionId(id);
    try {
      const { data } = await api.put(`/complaints/${id}/${action}`);
      setComplaints((prev) => prev.map((c) => (c.id === id ? data : c)));
      setSuccess(`Complaint #${id} ${action === "approve" ? "approved" : "rejected"}.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} complaint.`);
    } finally {
      setActionId(null);
    }
  };

  const pending  = complaints.filter((c) => c.status === "PENDING").length;
  const approved = complaints.filter((c) => c.status === "APPROVED").length;
  const rejected = complaints.filter((c) => c.status === "REJECTED").length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Mentor Panel</h1>
          <Link to="/dashboard" className="text-sm text-blue-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Pending Review",  value: pending,  color: "text-yellow-500" },
            { label: "Approved",         value: approved, color: "text-blue-600"   },
            { label: "Rejected",         value: rejected, color: "text-red-500"    },
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
                    <th className="pb-3 pr-4">Category</th>
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
