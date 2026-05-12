import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";

const LEAVE_TYPES = ["Duty Leave", "On-Duty", "Medical", "Work From Home"];

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold" style={{ color: "var(--accent)" }}>
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
        {hint}
      </p>
    </div>
  );
}

export default function EmployeeDutyLeave() {
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState([]);

  const selectedDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  const submitLeave = () => {
    if (!fromDate || !toDate || !reason.trim() || selectedDays <= 0) {
      alert("Please fill all fields and select a valid date range.");
      return;
    }

    setHistory((prev) => [
      {
        id: Date.now(),
        type: leaveType,
        from: fromDate,
        to: toDate,
        days: selectedDays,
        status: "Pending",
      },
      ...prev,
    ]);

    setReason("");
  };

  return (
    <AppShell title="Employee Leave Dashboard">
      <div className="max-w-7xl mx-auto px-2 py-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Selected Days" value={selectedDays} hint="Current request length" />
          <StatCard label="Total Requests" value={history.length} hint="Requests submitted so far" />
          <StatCard
            label="Pending"
            value={history.filter((item) => item.status === "Pending").length}
            hint="Awaiting manager approval"
          />
        </div>

        <div
          className="glass-card"
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            New Leave Request
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="glass-input w-full"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Describe purpose, impact and coverage plan..."
                className="glass-input resize-none w-full min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={submitLeave}
              className="btn-primary inline-flex items-center gap-2"
            >
              Submit Request
            </button>
          </div>
        </div>

        <div className="glass-card">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Leave History
          </h2>

          {history.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No leave requests submitted yet.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{}}
                >
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {item.type}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {item.from} to {item.to}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      {item.days} day(s)
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
