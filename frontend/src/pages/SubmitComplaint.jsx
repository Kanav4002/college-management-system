import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
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
  Cleaning: "Janitorial Staff",
  "IT / Network": "IT Department",
  Electrical: "Electrical Maintenance",
  Plumbing: "Plumbing Maintenance",
  Furniture: "Facilities Management",
  "Civil / Structural": "Civil Maintenance",
  "Pest Control": "Pest Control Services",
};

/* ═══════════════════════════════════════════════════════════════ */
function SubmitComplaint() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isMentor = auth?.role === "MENTOR";
  const isAdmin = auth?.role === "ADMIN";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const fieldShellClass = "relative";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const required = [
      "title",
      "issueType",
      "building",
      "floorNumber",
      "roomNumber",
      "description",
      "category",
      "priority",
    ];
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
      const endpoint = isAdmin
        ? "/complaints/admin"
        : isMentor
        ? "/complaints/mentor"
        : "/complaints";
      await api.post(endpoint, payload);
      // Show a small success message and navigate after a short delay so
      // the user sees confirmation before the panel changes.
      setSuccess('Complaint submitted successfully. Redirecting...');
      setTimeout(() => navigate(isAdmin ? "/admin" : isMentor ? "/mentor" : "/student"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full glass-input focus:ring-2 focus:ring-offset-2 transition-all";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <AppShell title="Submit Complaint">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <section className="glass-card overflow-hidden p-0">
          <div className="border-b px-6 py-5" style={{ borderColor: "var(--outline-variant)", background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--on-surface-variant)" }}>New request</p>
                <h2 className="mt-1 text-2xl font-bold" style={{ color: "var(--on-surface)" }}>Compose your complaint</h2>
              </div>
              <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                {resolvedDept}
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-7 space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="rounded-2xl p-4" style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 18%, transparent)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>Use a short title, exact room details, and a clear description.</p>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--on-surface-variant)" }}>
                The right department will be picked automatically once you choose the issue type.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>assignment</span>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Issue information</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      Complaint Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      placeholder="Brief title for your complaint"
                      className={`${inputCls} rounded-2xl px-4 py-3`}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      Issue Type <span className="text-red-400">*</span>
                    </label>
                    <select name="issueType" value={form.issueType} onChange={handleChange} required className={`${selectCls} rounded-2xl py-3 px-4`}>
                      <option value="">Select Issue Type</option>
                      {ISSUE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>Problem Start Time</label>
                    <input type="datetime-local" name="problemStartedAt" value={form.problemStartedAt} onChange={handleChange} className={`${inputCls} rounded-2xl py-3 px-4`} />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>Category <span className="text-red-400">*</span></label>
                    <select name="category" value={form.category} onChange={handleChange} required className={`${selectCls} rounded-2xl py-3 px-4`}>
                      <option value="">Select Category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>Priority <span className="text-red-400">*</span></label>
                    <select name="priority" value={form.priority} onChange={handleChange} required className={`${selectCls} rounded-2xl py-3 px-4`}>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isMentor && form.issueType && (
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, var(--primary) 9%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>route</span>
                    <span style={{ color: "var(--on-surface-variant)" }}>
                      Will be routed to <strong style={{ color: "var(--primary)" }}>{resolvedDept}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>location_on</span>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Location details</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>Building <span className="text-red-400">*</span></label>
                    <select name="building" value={form.building} onChange={handleChange} required className={`${selectCls} rounded-2xl py-3 px-4`}>
                      <option value="">Select Building</option>
                      {BUILDINGS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>Floor <span className="text-red-400">*</span></label>
                    <select name="floorNumber" value={form.floorNumber} onChange={handleChange} required className={`${selectCls} rounded-2xl py-3 px-4`}>
                      <option value="">Select Floor</option>
                      {FLOORS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--on-surface)" }}>Room Number <span className="text-red-400">*</span></label>
                    <input type="text" name="roomNumber" value={form.roomNumber} onChange={handleChange} required placeholder="Room number" className={`${inputCls} rounded-2xl py-3 px-4`} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>description</span>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Complaint details</h3>
                </div>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  required
                  placeholder="Describe the problem, what you noticed, when it started, and what impact it has on students or staff."
                  style={{ minHeight: 180 }}
                  className={`${inputCls} rounded-3xl py-4 px-4 resize-none`}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--outline-variant)" }}>
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  Keep the title short, the description specific, and the location exact.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-semibold shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {submitting ? "Submitting…" : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default SubmitComplaint;
