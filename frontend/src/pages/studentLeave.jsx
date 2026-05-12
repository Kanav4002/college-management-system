import React, { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import api from "../api/api";

const LEAVE_TYPES = ["Medical", "Personal", "Duty Leave", "Academic"];

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{label}</span>
      </div>
      <p className="text-4xl font-bold" style={{ color: "var(--on-surface)" }}>{value}</p>
    </div>
  );
}

const statusStyles = {
  PENDING: { bg: "color-mix(in srgb, #facc15 15%, transparent)", color: "#facc15" },
  APPROVED: { bg: "color-mix(in srgb, #4ade80 15%, transparent)", color: "#4ade80" },
  REJECTED: { bg: "color-mix(in srgb, var(--error) 15%, transparent)", color: "var(--error)" },
};
function LeaveHistoryCard({ leave }) {
  const s = statusStyles[leave.status] || statusStyles.PENDING;

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold" style={{ color: "var(--on-surface)" }}>
            {leave.type || leave.leaveType}
          </h4>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()} • {leave.days || leave.duration} Days
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: s.bg, color: s.color }}
        >
          {leave.status}
        </span>
      </div>
      {leave.reason && (
        <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--on-surface-variant)" }}>
          {leave.reason}
        </p>
      )}
      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--outline-variant)" }}>
        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
          {new Date(leave.createdAt || leave.appliedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

const DutyLeave = () => {
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedDays = (() => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const fetchHistory = async () => {
    try {
      const res = await api.get("/leaves/my");
      setLeaveHistory(res.data || []);
    } catch {
      setLeaveHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const submitForm = async () => {
    if (!fromDate || !toDate || !reason.trim() || selectedDays <= 0) {
      setError("Please fill all fields and select a valid date range.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/leaves", {
        leaveType,
        reason,
        startDate: fromDate,
        endDate: toDate,
        days: selectedDays,
      });
      setFromDate("");
      setToDate("");
      setReason("");
      setLeaveType(LEAVE_TYPES[0]);
      setSuccess("Leave request submitted successfully.");
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const approvedCount = leaveHistory.filter(l => l.status === "APPROVED").length;
  const pendingCount = leaveHistory.filter(l => l.status === "PENDING").length;
  const totalLeaves = leaveHistory.length;

  return (
    <AppShell title="Student Leave Dashboard">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Greeting */}
        <div>
          <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--on-surface)" }}>
            Leave Management
          </h2>
          <p style={{ color: "var(--on-surface-variant)" }}>
            Apply for leave and track your requests.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Leaves" value={totalLeaves} icon="calendar_month" color="var(--on-surface)" />
          <StatCard label="Pending" value={pendingCount} icon="pending" color="#facc15" />
          <StatCard label="Approved" value={approvedCount} icon="check_circle" color="#4ade80" />
          <StatCard label="Selected Days" value={selectedDays} icon="schedule" color="var(--primary)" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leave Form */}
          <div className="card">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--on-surface)" }}>
                Apply for Leave
              </h3>
              <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                Submit your request for time off.
              </p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "var(--error-container)", color: "var(--on-error-container)" }}>
                <span className="material-symbols-outlined text-base mr-2">error</span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface)" }}>
                  Leave Type
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[16px]" style={{ color: "var(--on-surface-variant)" }}>work</span>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full appearance-none rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition"
                    style={{
                      background: "var(--surface-container-low)",
                      border: "1px solid var(--outline-variant)",
                      color: "var(--on-surface)",
                    }}
                  >
                    {LEAVE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: "var(--on-surface-variant)" }}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface)" }}>
                    Start Date
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[16px]" style={{ color: "var(--on-surface-variant)" }}>calendar_today</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition"
                      style={{
                        background: "var(--surface-container-low)",
                        border: "1px solid var(--outline-variant)",
                        color: "var(--on-surface)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface)" }}>
                    End Date
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[16px]" style={{ color: "var(--on-surface-variant)" }}>calendar_today</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition"
                      style={{
                        background: "var(--surface-container-low)",
                        border: "1px solid var(--outline-variant)",
                        color: "var(--on-surface)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Duration Badge */}
              {selectedDays > 0 && (
                <div className="flex justify-end">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
                    <span className="material-symbols-outlined text-base">schedule</span>
                    Duration: {selectedDays} Day{selectedDays !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface)" }}>
                  Reason for Leave
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-4 text-[16px]" style={{ color: "var(--on-surface-variant)" }}>description</span>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Please provide a brief explanation for your leave request..."
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition resize-none"
                    style={{
                      background: "var(--surface-container-low)",
                      border: "1px solid var(--outline-variant)",
                      color: "var(--on-surface)",
                    }}
                  />
                </div>
              </div>

              {success && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "var(--success-container)", color: "var(--on-success-container)" }}>
                  <span className="material-symbols-outlined text-base mr-2">check_circle</span>
                  {success}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setFromDate(""); setToDate(""); setReason(""); setError(""); }}
                  className="px-6 py-3 rounded-xl text-sm font-medium transition"
                  style={{ border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitForm}
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl text-sm font-bold transition inline-flex items-center gap-2"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                  {!submitting && <span className="material-symbols-outlined text-base">send</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Leave History */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
              Recent Leave History
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12" style={{ color: "var(--on-surface-variant)" }}>
                <span className="material-symbols-outlined animate-spin text-base mr-2">progress_activity</span>
                Loading...
              </div>
            ) : leaveHistory.length === 0 ? (
              <div className="card text-center py-12">
                <span className="material-symbols-outlined text-4xl mb-3" style={{ color: "var(--on-surface-variant)" }}>calendar_today</span>
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  No leave requests yet. Submit one to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveHistory.map((leave) => (
                  <LeaveHistoryCard key={leave._id || leave.id} leave={leave} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
};

export default DutyLeave;