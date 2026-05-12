import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

/* ── Status / Priority style maps ─────────────────────────────── */
const statusStyles = {
  PENDING:  { bg: "color-mix(in srgb, #f59e0b 15%, transparent)", color: "#f59e0b" },
  APPROVED: { bg: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" },
  REJECTED: { bg: "color-mix(in srgb, var(--error) 15%, transparent)", color: "var(--error)" },
  ASSIGNED: { bg: "color-mix(in srgb, #8b5cf6 15%, transparent)", color: "#8b5cf6" },
  RESOLVED: { bg: "color-mix(in srgb, #22c55e 15%, transparent)", color: "#22c55e" },
  CLOSED:   { bg: "var(--surface-container-high)", color: "var(--on-surface-variant)" },
};

const priorityStyles = {
  LOW:    { dot: "#9ca3af" },
  MEDIUM: { dot: "#f59e0b" },
  HIGH:   { dot: "var(--error)" },
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
      <dt className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
        {label}
      </dt>
      <dd className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
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
    /* Backdrop - Dark translucent overlay */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        animation: "modalOverlayIn 200ms ease-out",
      }}
      onClick={onClose}
    >
      {/* Modal container - Solid dark card with depth */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl"
        style={{
          background: "color-mix(in srgb, var(--surface-container-lowest) 98%, transparent)",
          border: "1px solid var(--outline-variant)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)",
          animation: "modalSlideIn 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5"
          style={{
            background: "color-mix(in srgb, var(--surface-container-lowest) 99%, transparent)",
            borderBottom: "1px solid var(--outline-variant)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }} title={c.id}>
                #{String(c.id).slice(-6)}
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: statusStyles[c.status]?.bg, color: statusStyles[c.status]?.color }}>
                {c.status}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "var(--surface-container-low)", color: pStyle.dot }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pStyle.dot }} />
                {c.priority}
              </span>
            </div>
            <h2 className="text-lg font-bold leading-snug" style={{ color: "var(--on-surface)" }}>
              {c.title}
            </h2>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition cursor-pointer"
            style={{
              background: "var(--surface-container-high)",
              color: "var(--on-surface-variant)",
              border: "1px solid var(--outline-variant)",
            }}
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>

          {/* Status message banner */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
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
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
              Description
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--on-surface-variant)" }}>
              {c.description}
            </p>
          </div>

          {/* Detail grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
              <span className="material-symbols-outlined text-base">chat</span>
              Comments ({comments.length})
            </h3>

            {/* Comment list */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {loadingComments ? (
                <p className="text-xs italic" style={{ color: "var(--on-surface-variant)" }}>Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-xs italic" style={{ color: "var(--on-surface-variant)" }}>No comments yet. Be the first to add one.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg px-4 py-3"
                    style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: "var(--on-surface)" }}>
                          {comment.authorName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                          background: comment.authorRole === "ADMIN" ? "color-mix(in srgb, #8b5cf6 15%, transparent)" :
                            comment.authorRole === "MENTOR" ? "color-mix(in srgb, var(--primary) 15%, transparent)" :
                            "var(--surface-container-high)",
                          color: comment.authorRole === "ADMIN" ? "#8b5cf6" :
                            comment.authorRole === "MENTOR" ? "var(--primary)" :
                            "var(--on-surface-variant)"
                        }}>
                          {comment.authorRole}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line" style={{ color: "var(--on-surface-variant)" }}>
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment error */}
            {commentError && (
              <p className="text-xs mb-2" style={{ color: "var(--error)" }}>{commentError}</p>
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
                  className="flex-1 text-sm rounded-xl px-4 py-3 outline-none transition"
                  style={{
                    background: "var(--surface-container-low)",
                    border: "1px solid var(--outline-variant)",
                    color: "var(--on-surface)",
                  }}
                  disabled={postingComment}
                />
                <button
                  onClick={handleAddComment}
                  disabled={postingComment || !newComment.trim()}
                  className="px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer — Actions ─────────────────────────────────── */}
        <div
          className="sticky bottom-0 z-10 flex items-center justify-between gap-3 px-6 py-4"
          style={{
            background: "color-mix(in srgb, var(--surface-container-lowest) 99%, transparent)",
            borderTop: "1px solid var(--outline-variant)",
            boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Left: close */}
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl transition cursor-pointer"
            style={{
              background: "var(--surface-container-low)",
              color: "var(--on-surface-variant)",
              border: "1px solid var(--outline-variant)",
            }}
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                  style={{ background: "#22c55e", color: "white", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)" }}
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Approve
                </button>
                <button
                  onClick={() => onAction(c.id, "reject")}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                  style={{ background: "var(--error)", color: "white", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)" }}
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                  Reject
                </button>
              </>
            )}

            {/* Escalate to admin (PENDING or APPROVED) */}
            {role === "MENTOR" && (c.status === "PENDING" || c.status === "APPROVED") && onAction && (
              <button
                onClick={() => onAction(c.id, "escalate")}
                disabled={acting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                style={{ background: "#f59e0b", color: "white", boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)" }}
              >
                <span className="material-symbols-outlined text-base">arrow_upward</span>
                Escalate
              </button>
            )}

            {/* ── ADMIN actions ───────────────────────────────────── */}
            {/* Resolve (APPROVED / ASSIGNED) */}
            {role === "ADMIN" && (c.status === "APPROVED" || c.status === "ASSIGNED") && onAction && (
              <button
                onClick={() => onAction(c.id, "resolve")}
                disabled={acting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                style={{ background: "#22c55e", color: "white", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)" }}
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                Resolve
              </button>
            )}

            {/* Assign to department (PENDING / APPROVED) */}
            {role === "ADMIN" && (c.status === "PENDING" || c.status === "APPROVED") && onAction && (
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={acting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                style={{ background: "#8b5cf6", color: "white", boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)" }}
              >
                <span className="material-symbols-outlined text-base">assignment_ind</span>
                Assign
              </button>
            )}

            {/* Close complaint (any non-closed status) */}
            {role === "ADMIN" && !isClosed && onAction && (
              <button
                onClick={() => onAction(c.id, "close")}
                disabled={acting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
              >
                <span className="material-symbols-outlined text-base">lock</span>
                Close
              </button>
            )}

            {/* Delete complaint */}
            {role === "ADMIN" && onAction && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={acting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--error)", color: "white", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)" }}
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Delete
              </button>
            )}

            {/* Terminal state indicators */}
            {isResolved && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#22c55e" }}>
                <span className="material-symbols-outlined text-base">verified</span>
                Resolved
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                <span className="material-symbols-outlined text-base">lock</span>
                Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Assign Department Sub-Modal ────────────────────────── */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="rounded-2xl p-8 w-full max-w-sm"
            style={{
              background: "var(--surface-container-lowest)",
              border: "1px solid var(--outline-variant)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
              Assign to Department
            </h3>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-sm rounded-xl px-4 py-3 mb-6 outline-none transition"
              style={{
                background: "var(--surface-container-low)",
                border: "1px solid var(--outline-variant)",
                color: "var(--on-surface)",
              }}
            >
              <option value="">Select Department…</option>
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer"
                style={{
                  background: "var(--surface-container-low)",
                  color: "var(--on-surface-variant)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedDept}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--primary)", color: "var(--on-primary)" }}
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
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="rounded-2xl p-8 w-full max-w-sm"
            style={{
              background: "var(--surface-container-lowest)",
              border: "1px solid var(--outline-variant)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "color-mix(in srgb, var(--error) 15%, transparent)" }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: "var(--error)" }}>warning</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--on-surface)" }}>
              Delete Complaint #{String(c.id).slice(-6)}?
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--on-surface-variant)" }}>
              This action cannot be undone. All associated comments will also be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer"
                style={{
                  background: "var(--surface-container-low)",
                  color: "var(--on-surface-variant)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer"
                style={{ background: "var(--error)", color: "white" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
