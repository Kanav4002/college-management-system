import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-orange-100 text-orange-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED:   "bg-gray-200 text-gray-600",
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
  CLOSED:   "Complaint has been closed",
};

/* ── Department options for admin assignment ───────────────────── */
const DEPARTMENT_OPTIONS = [
  "Janitorial Staff",
  "IT Department",
  "Electrical Maintenance",
  "Plumbing Maintenance",
  "Facilities Management",
  "Civil Maintenance",
  "Pest Control Services",
  "General Administration",
];

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
 *  - onAction    : (id, action, data?) => void — for mentor approve/reject/escalate, admin resolve/close/assign/delete
 *  - acting      : boolean                — disable buttons while in flight
 *  - onUpdate    : (updatedComplaint) => void — callback after comment/edit, so parent can refresh
 */
export default function ComplaintDetailModal({ complaint: c, onClose, role = "STUDENT", onAction, acting = false, onUpdate }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentError, setCommentError] = useState("");

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

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!c?.id) return;
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/complaints/${c.id}/comments`);
      setComments(data);
    } catch {
      // silently fail — comments are optional
    } finally {
      setLoadingComments(false);
    }
  }, [c?.id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  if (!c) return null;

  const pStyle = priorityStyles[c.priority] || priorityStyles.LOW;
  const location = c.building ? `${c.building}, ${c.floorNumber} Floor, Rm ${c.roomNumber}` : null;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    setCommentError("");
    try {
      const { data } = await api.post(`/complaints/${c.id}/comments`, { content: newComment.trim() });
      setComments((prev) => [...prev, data]);
      setNewComment("");
    } catch (err) {
      setCommentError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleAssign = () => {
    if (!selectedDept) return;
    onAction?.(c.id, "assign", { department: selectedDept });
    setShowAssignModal(false);
    setSelectedDept("");
  };

  const handleDelete = () => {
    onAction?.(c.id, "delete");
    setShowDeleteConfirm(false);
  };

  const isClosed = c.status === "CLOSED";
  const isResolved = c.status === "RESOLVED";
  const isTerminal = isClosed || isResolved;

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
              <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }} title={c.id}>
                #{String(c.id).slice(-6)}
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
            {c.status === "RESOLVED" || c.status === "CLOSED" ? (
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

          {/* ── Comments Section ─────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comments ({comments.length})
            </h3>

            {/* Comment list */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {loadingComments ? (
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>No comments yet. Be the first to add one.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg px-4 py-3"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {comment.authorName}
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          comment.authorRole === "ADMIN" ? "bg-purple-100 text-purple-700" :
                          comment.authorRole === "MENTOR" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {comment.authorRole}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment error */}
            {commentError && (
              <p className="text-xs text-red-500 mb-2">{commentError}</p>
            )}

            {/* Add comment input */}
            {!isTerminal && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  placeholder="Write a comment…"
                  className="flex-1 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0088D1]/30 transition"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  disabled={postingComment}
                />
                <button
                  onClick={handleAddComment}
                  disabled={postingComment || !newComment.trim()}
                  className="px-3 py-2 bg-[#0088D1] text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {postingComment ? "…" : "Send"}
                </button>
              </div>
            )}
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
          <div className="flex items-center gap-2 flex-wrap justify-end">

            {/* ── STUDENT: no extra actions (can only view + comment) ── */}

            {/* ── MENTOR actions ──────────────────────────────────── */}
            {/* Approve / Reject on PENDING */}
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

            {/* Escalate to admin (PENDING or APPROVED) */}
            {role === "MENTOR" && (c.status === "PENDING" || c.status === "APPROVED") && onAction && (
              <button
                onClick={() => onAction(c.id, "escalate")}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Escalate
              </button>
            )}

            {/* ── ADMIN actions ───────────────────────────────────── */}
            {/* Resolve (APPROVED / ASSIGNED) */}
            {role === "ADMIN" && (c.status === "APPROVED" || c.status === "ASSIGNED") && onAction && (
              <button
                onClick={() => onAction(c.id, "resolve")}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Resolve
              </button>
            )}

            {/* Assign to department (PENDING / APPROVED) */}
            {role === "ADMIN" && (c.status === "PENDING" || c.status === "APPROVED") && onAction && (
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Assign
              </button>
            )}

            {/* Close complaint (any non-closed status) */}
            {role === "ADMIN" && !isClosed && onAction && (
              <button
                onClick={() => onAction(c.id, "close")}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Close
              </button>
            )}

            {/* Delete complaint */}
            {role === "ADMIN" && onAction && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}

            {/* Terminal state indicators */}
            {isResolved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolved
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Assign Department Sub-Modal ────────────────────────── */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="rounded-xl p-6 shadow-2xl w-full max-w-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Assign to Department
            </h3>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-[#0088D1]/30"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <option value="">Select Department…</option>
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-2 text-sm rounded-lg cursor-pointer"
                style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedDept}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Sub-Modal ──────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="rounded-xl p-6 shadow-2xl w-full max-w-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Delete Complaint #{String(c.id).slice(-6)}?
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              This action cannot be undone. All associated comments will also be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 text-sm rounded-lg cursor-pointer"
                style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
