import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const CATEGORIES = ["Academic", "Infrastructure", "Hostel", "Library", "Other"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

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

function StudentPanel() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    priority: "MEDIUM",
  });

  const fetchComplaints = useCallback(async () => {
    try {
      const { data } = await api.get("/complaints/my");
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

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/complaints", form);
      setComplaints((prev) => [data, ...prev]);
      setForm({ title: "", description: "", category: CATEGORIES[0], priority: "MEDIUM" });
      setShowForm(false);
      setSuccess("Complaint submitted successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const pending  = complaints.filter((c) => c.status === "PENDING").length;
  const approved = complaints.filter((c) => c.status === "APPROVED").length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Student Panel</h1>
          <Link to="/dashboard" className="text-sm text-blue-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Pending", value: pending,  color: "text-yellow-500" },
            { label: "Approved", value: approved, color: "text-blue-600"   },
            { label: "Resolved", value: resolved, color: "text-green-600"  },
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

        {/* Create Complaint */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Raise a Complaint</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              {showForm ? "Cancel" : "+ New Complaint"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting…" : "Submit Complaint"}
              </button>
            </form>
          )}
        </div>

        {/* My Complaints Table */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">My Complaints</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-gray-500">No complaints yet. Raise one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Priority</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Mentor</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-800">{c.title}</td>
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
                      <td className="py-3 pr-4 text-gray-500">{c.mentorName || "—"}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
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

export default StudentPanel;
