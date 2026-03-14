import { useEffect } from "react";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-orange-100 text-orange-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-green-100 text-green-700",
};

const priorityStyles = {
  LOW:    { bg: "bg-gray-100", text: "text-gray-600", dot: "#9ca3af" },
  MEDIUM: { bg: "bg-orange-100", text: "text-orange-600", dot: "#f59e0b" },
  HIGH:   { bg: "bg-red-100", text: "text-red-600", dot: "#ef4444" },
};

const statusMessages = {
  PENDING:  "Awaiting mentor review",
  APPROVED: "Approved — awaiting resolution by admin",
  REJECTED: "Rejected by mentor",
  ASSIGNED: "Auto-routed to assigned department",
  RESOLVED: "Resolved successfully",
};

/* ── Detail field ─────────────────────────────────────────────── */
function Field({ label, value, fullWidth = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </dt>
      <dd className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}

/**
 * ComplaintDetailModal — full-screen overlay modal displaying complaint details.
 *
 * Props:
 *  - complaint   : complaint object
 *  - onClose     : () => void
 *  - role        : "STUDENT" | "MENTOR" | "ADMIN"
 *  - onAction    : (id, action) => void   — for mentor approve/reject or admin resolve
 *  - acting      : boolean                — disable buttons while in flight
 */
export default function ComplaintDetailModal({ complaint: c, onClose, role = "STUDENT", onAction, acting = false }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!c) return null;

  const pStyle = priorityStyles[c.priority] || priorityStyles.LOW;
  const location = c.building ? `${c.building}, ${c.floorNumber} Floor, Rm ${c.roomNumber}` : null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Modal container */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 rounded-t-2xl"
          style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                #{c.id}
              </span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusStyles[c.status]}`}>
                {c.status}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${pStyle.bg} ${pStyle.text}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pStyle.dot }} />
                {c.priority}
              </span>
            </div>
            <h2 className="text-lg font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
              {c.title}
            </h2>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition cursor-pointer hover:opacity-70"
            style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}
            title="Close (Esc)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-6">

          {/* Status message banner */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
          >
            {c.status === "RESOLVED" ? (
              <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : c.status === "REJECTED" ? (
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" style={{ color: "var(--accent, #0088D1)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{statusMessages[c.status] || "—"}</span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Description
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
              {c.description}
            </p>
          </div>

          {/* Detail grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Complaint Details
            </h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Issue Type" value={c.issueType || c.category} />
              <Field label="Category" value={c.category} />
              <Field label="Priority" value={c.priority} />
              <Field label="Location" value={location} fullWidth={!!location && location.length > 30} />
              <Field label="Building" value={c.building} />
              <Field label="Floor" value={c.floorNumber} />
              <Field label="Room" value={c.roomNumber} />
            </dl>
          </div>

          {/* People */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              People
            </h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Raised By" value={c.studentName} />
              <Field label="Student Email" value={c.studentEmail} />
              <Field label="Submitter Role" value={c.submitterRole} />
              <Field label="Reviewed By (Mentor)" value={c.mentorName || "—"} />
              {c.groupName && <Field label="Group" value={c.groupName} />}
              <Field label="Assigned Department" value={c.assignedDepartment || "—"} />
            </dl>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Timeline
            </h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Created At" value={new Date(c.createdAt).toLocaleString()} />
              {c.problemStartedAt && (
                <Field label="Problem Started" value={new Date(c.problemStartedAt).toLocaleString()} />
              )}
              {c.updatedAt && (
                <Field label="Last Updated" value={new Date(c.updatedAt).toLocaleString()} />
              )}
            </dl>
          </div>
        </div>

        {/* ── Footer — Actions ─────────────────────────────────── */}
        <div
          className="sticky bottom-0 z-10 flex items-center justify-between gap-3 px-6 py-4 rounded-b-2xl"
          style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}
        >
          {/* Left: close */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer hover:opacity-80"
            style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
          >
            Close
          </button>

          {/* Right: role-based actions */}
          <div className="flex items-center gap-2">
            {/* MENTOR actions: Approve / Reject on PENDING complaints */}
            {role === "MENTOR" && c.status === "PENDING" && onAction && (
              <>
                <button
                  onClick={() => onAction(c.id, "approve")}
                  disabled={acting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                <button
                  onClick={() => onAction(c.id, "reject")}
                  disabled={acting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </>
            )}

            {/* ADMIN actions: Resolve on APPROVED / ASSIGNED complaints */}
            {role === "ADMIN" && (c.status === "APPROVED" || c.status === "ASSIGNED") && onAction && (
              <button
                onClick={() => onAction(c.id, "resolve")}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Mark as Resolved
              </button>
            )}

            {/* Already resolved indicator */}
            {c.status === "RESOLVED" && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
