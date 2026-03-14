import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
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

/* ── Routing preview (same as backend map) ─────────────────────── */
const DEPT_MAP = {
  "Cleaning":          "Janitorial Staff",
  "IT / Network":      "IT Department",
  "Electrical":        "Electrical Maintenance",
  "Plumbing":          "Plumbing Maintenance",
  "Furniture":         "Facilities Management",
  "Civil / Structural":"Civil Maintenance",
  "Pest Control":      "Pest Control Services",
};

/* ═══════════════════════════════════════════════════════════════ */
function SubmitComplaint() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isMentor = auth?.role === "MENTOR";
  const isAdmin = auth?.role === "ADMIN";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = {
    title: "",
    description: "",
    category: "",
    issueType: "",
    building: "",
    floorNumber: "",
    roomNumber: "",
    problemStartedAt: "",
    priority: "MEDIUM",
  };

  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resolvedDept = DEPT_MAP[form.issueType] || "General Administration";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const required = ["title", "issueType", "building", "floorNumber", "roomNumber", "description", "category", "priority"];
    for (const key of required) {
      if (!form[key]?.trim()) {
        setError(`Please fill in all required fields.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        problemStartedAt: form.problemStartedAt
          ? new Date(form.problemStartedAt).toISOString()
          : null,
      };

      // Route to correct endpoint by role
      const endpoint = isAdmin ? "/complaints/admin" : isMentor ? "/complaints/mentor" : "/complaints";
      await api.post(endpoint, payload);
      navigate(isAdmin ? "/admin" : isMentor ? "/mentor" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0088D1]";

  const selectCls =
    `${inputCls} appearance-none`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <Navbar title="Submit Complaint" showBack />

      <div className="flex items-center justify-center px-4 py-10">
        <div
          className="rounded-2xl shadow-lg w-full max-w-2xl p-8"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--text-primary)" }}>
            Submit a Complaint
          </h1>

          {/* Mentor / Admin routing banner */}
          {(isMentor || isAdmin) && (
            <p className="text-center text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {isAdmin
                ? "Admin-created complaints are submitted with PENDING status."
                : "Your complaint will be auto-routed to the appropriate department for faster resolution."}
            </p>
          )}

          {!isMentor && !isAdmin && <div className="mb-8" />}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ── Issue Information ──────────────────────────────── */}
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Issue Information</h2>
              <div className="h-px mb-4" style={{ background: "var(--border)" }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Complaint Title */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                    Complaint Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="Brief title for your complaint"
                    className={inputCls}
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                    Issue Type <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </span>
                    <select name="issueType" value={form.issueType} onChange={handleChange} required className={`${selectCls} pl-9`} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <option value="">Select Issue Type</option>
                      {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Problem Start Time */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Problem Start Time</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <input type="datetime-local" name="problemStartedAt" value={form.problemStartedAt} onChange={handleChange} className={`${inputCls} pl-9`} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                  </div>
                </div>

                {/* Category & Priority */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Category <span className="text-red-400">*</span></label>
                  <select name="category" value={form.category} onChange={handleChange} required className={selectCls} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <option value="">Select Category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Priority <span className="text-red-400">*</span></label>
                  <select name="priority" value={form.priority} onChange={handleChange} required className={selectCls} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Live department routing preview (mentor only) */}
              {isMentor && form.issueType && (
                <div className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <svg className="w-4 h-4 shrink-0 text-[#0088D1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Will be routed to: <strong className="text-[#0088D1]">{resolvedDept}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* ── Location Details ───────────────────────────────── */}
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Location Details</h2>
              <div className="h-px mb-4" style={{ background: "var(--border)" }} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Building */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Building <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                    <select name="building" value={form.building} onChange={handleChange} required className={`${selectCls} pl-9`} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <option value="">Select Building</option>
                      {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                {/* Floor */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Floor <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </span>
                    <select name="floorNumber" value={form.floorNumber} onChange={handleChange} required className={`${selectCls} pl-9`} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <option value="">Select Floor</option>
                      {FLOORS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {/* Room Number */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Room Number <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input type="text" name="roomNumber" value={form.roomNumber} onChange={handleChange} required placeholder="Enter Room Number" className={`${inputCls} pl-9`} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Complaint Details ──────────────────────────────── */}
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Complaint Details</h2>
              <div className="h-px mb-4" style={{ background: "var(--border)" }} />
              <div className="relative">
                <span className="absolute left-3 top-3" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  required
                  placeholder="Describe the problem in detail. Include any relevant context, potential causes, and the impact on daily operations."
                  className={`${inputCls} pl-9 resize-none`}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            {/* ── Submit ────────────────────────────────────────── */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#0088D1] text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {submitting ? "Submitting…" : "Submit Complaint"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitComplaint;
