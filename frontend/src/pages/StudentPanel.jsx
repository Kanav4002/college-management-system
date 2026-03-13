import { useState, useEffect, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

/* ── Dropdown options ──────────────────────────────────────────── */
const ISSUE_TYPES = [
  "Electrical",
  "Plumbing",
  "Cleaning",
  "IT / Network",
  "Furniture",
  "Civil / Structural",
  "Pest Control",
  "Other",
];

const CATEGORIES = [
  "Academic",
  "Infrastructure",
  "Hostel",
  "Library",
  "Canteen",
  "Sports",
  "Other",
];

const BUILDINGS = [
  "Main Building",
  "Science Block",
  "Engineering Block",
  "Library Building",
  "Hostel A",
  "Hostel B",
  "Hostel C",
  "Admin Block",
  "Canteen Building",
  "Sports Complex",
];

const FLOORS = ["Ground", "1st", "2nd", "3rd", "4th", "5th"];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

/* ── Style maps ───────────────────────────────────────────────── */
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

/* ── Mini bar chart ───────────────────────────────────────────── */
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

/* ── Reusable form-field wrapper ──────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

/* ═══════════════════════════════════════════════════════════════ */
function StudentPanel() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emptyForm = {
    title: "",
    description: "",
    category: CATEGORIES[0],
    issueType: ISSUE_TYPES[0],
    building: BUILDINGS[0],
    floorNumber: FLOORS[0],
    roomNumber: "",
    problemStartedAt: "",
    priority: "MEDIUM",
  };

  const [form, setForm] = useState(emptyForm);

  /* ── Fetch ─────────────────────────────────────────────────── */
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ── Validation & Submit ───────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    const required = ["title", "description", "issueType", "building", "floorNumber", "roomNumber"];
    for (const key of required) {
      if (!form[key]?.trim()) {
        setError(`Please fill in the "${key.replace(/([A-Z])/g, " $1").trim()}" field.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Build payload — convert datetime-local string → ISO
      const payload = {
        ...form,
        problemStartedAt: form.problemStartedAt
          ? new Date(form.problemStartedAt).toISOString()
          : null,
      };

      const { data } = await api.post("/complaints", payload);
      setComplaints((prev) => [data, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      setSuccess("Complaint submitted successfully!");
      setTimeout(() => setSuccess(""), 4000);

      // Refresh stats
      const { data: newStats } = await api.get("/complaints/stats/student");
      setStats(newStats);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Expanded-row state for mobile-friendly detail view ───── */
  const [expandedId, setExpandedId] = useState(null);

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Student Panel</h1>
          <Link to="/dashboard" className="text-sm text-blue-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ── Stats Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total",    value: stats?.total    ?? "–", icon: "📋", color: "text-gray-700",   bg: "bg-gray-50"   },
            { label: "Pending",  value: stats?.pending  ?? "–", icon: "⏳", color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Approved", value: stats?.approved ?? "–", icon: "✅", color: "text-blue-600",   bg: "bg-blue-50"   },
            { label: "Rejected", value: stats?.rejected ?? "–", icon: "❌", color: "text-red-500",    bg: "bg-red-50"    },
            { label: "Resolved", value: stats?.resolved ?? "–", icon: "🎉", color: "text-green-600",  bg: "bg-green-50"  },
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

        {/* ── Category Breakdown ────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Complaints by Category</h2>
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

        {/* ── Create Complaint ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
              {/* Row 1 — Title */}
              <Field label="Title" required>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>

              {/* Row 2 — Issue Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Issue Type" required>
                  <select
                    name="issueType"
                    value={form.issueType}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  >
                    {ISSUE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Category" required>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Row 3 — Date/time problem started & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="When did the problem start?">
                  <input
                    type="datetime-local"
                    name="problemStartedAt"
                    value={form.problemStartedAt}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </Field>

                <Field label="Priority" required>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Row 4 — Building & Floor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Building" required>
                  <select
                    name="building"
                    value={form.building}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  >
                    {BUILDINGS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Floor" required>
                  <select
                    name="floorNumber"
                    value={form.floorNumber}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  >
                    {FLOORS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Room Number" required>
                  <input
                    name="roomNumber"
                    value={form.roomNumber}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 204"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Row 5 — Description */}
              <Field label="Complaint Description" required>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  placeholder="Describe the issue in detail…"
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting…" : "Submit Complaint"}
              </button>
            </form>
          )}
        </div>

        {/* ── My Complaints Table ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                    <th className="pb-3 pr-4">Issue Type</th>
                    <th className="pb-3 pr-4">Location</th>
                    <th className="pb-3 pr-4">Priority</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Mentor</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complaints.map((c) => (
                    <Fragment key={c.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      >
                        <td className="py-3 pr-4 font-medium text-gray-800">
                          {c.title}
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{c.description}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{c.issueType || c.category}</td>
                        <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                          {c.building ? `${c.building}, ${c.floorNumber} Floor, Rm ${c.roomNumber}` : "—"}
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
                        <td className="py-3 pr-4 text-gray-500">{c.mentorName || "—"}</td>
                        <td className="py-3 text-gray-500 whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                      {expandedId === c.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                              <div><span className="font-semibold text-gray-500">Category:</span> {c.category}</div>
                              <div><span className="font-semibold text-gray-500">Issue Type:</span> {c.issueType || "—"}</div>
                              <div><span className="font-semibold text-gray-500">Building:</span> {c.building || "—"}</div>
                              <div><span className="font-semibold text-gray-500">Floor:</span> {c.floorNumber || "—"}</div>
                              <div><span className="font-semibold text-gray-500">Room:</span> {c.roomNumber || "—"}</div>
                              <div>
                                <span className="font-semibold text-gray-500">Problem Since:</span>{" "}
                                {c.problemStartedAt ? new Date(c.problemStartedAt).toLocaleString() : "—"}
                              </div>
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-gray-500">Description:</span> {c.description}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
