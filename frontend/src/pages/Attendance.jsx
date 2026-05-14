/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import api, { getApiErrorMessage } from "../api/api";

const statusMeta = {
  PRESENT: { label: "Present", color: "#16a34a", bg: "color-mix(in srgb, #16a34a 14%, transparent)" },
  ABSENT: { label: "Absent", color: "var(--error)", bg: "color-mix(in srgb, var(--error) 14%, transparent)" },
  LEAVE: { label: "Leave", color: "#ca8a04", bg: "color-mix(in srgb, #eab308 18%, transparent)" },
  PENDING: { label: "Pending", color: "#ca8a04", bg: "color-mix(in srgb, #eab308 18%, transparent)" },
};

const inputStyle = {
  background: "var(--surface-container-low)",
  border: "1px solid var(--outline-variant)",
  color: "var(--on-surface)",
};

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.PENDING;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: meta.bg, color: meta.color }}>
      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function StatCard({ icon, label, value, sublabel, color = "var(--primary)" }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
          <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
        </div>
        <div>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: "var(--on-surface)" }}>{value}</p>
          {sublabel && <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{sublabel}</p>}
        </div>
      </div>
    </Card>
  );
}

function ProgressBar({ value, color = "var(--primary)" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-container-high)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%`, background: color }} />
    </div>
  );
}

function MiniBarChart({ data }) {
  if (!data?.length) {
    return <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>No trend data yet.</p>;
  }
  const max = Math.max(...data.map((item) => item.percentage), 1);
  return (
    <div className="flex h-40 items-end gap-3">
      {data.map((item) => (
        <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full items-end rounded-md" style={{ height: 112, background: "var(--surface-container-low)" }}>
            <div
              className="w-full rounded-md"
              title={`${item.month}: ${item.percentage}%`}
              style={{
                height: `${Math.max((item.percentage / max) * 100, 8)}%`,
                background: item.percentage < 75 ? "#eab308" : "var(--primary)",
              }}
            />
          </div>
          <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>{item.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [correctionId, setCorrectionId] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");

  const loadSummary = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/attendance/student/summary", { params: month ? { month } : {} });
      setSummary(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load attendance."));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => {
    const id = setInterval(loadSummary, 6000);
    return () => clearInterval(id);
  }, [loadSummary]);

  const overall = summary?.overall || {};
  const history = summary?.history || [];

  const exportSummary = () => {
    downloadCsv("attendance-summary.csv", [
      ["Subject", "Code", "Total", "Present", "Absent", "Leave", "Pending", "Percentage"],
      ...(summary?.subjectWise || []).map((item) => [
        item.subjectName,
        item.subjectCode,
        item.total,
        item.present,
        item.absent,
        item.leave,
        item.pending,
        `${item.percentage}%`,
      ]),
    ]);
  };

  const requestCorrection = async () => {
    if (!correctionId || !correctionReason.trim()) return;
    setError("");
    try {
      await api.put(`/attendance/records/${correctionId}/correction`, { reason: correctionReason });
      setCorrectionId("");
      setCorrectionReason("");
      await loadSummary();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to request correction."));
    }
  };

  return (
    <AppShell title="Attendance Dashboard">
      <main className="max-w-7xl mx-auto px-2 pb-6 pt-2 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Live records update every few seconds.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            <button type="button" onClick={exportSummary} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base">download</span>
              CSV
            </button>
          </div>
        </div>

        {error && <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--error-container)", color: "var(--on-error-container)" }}>{error}</div>}
        {overall.lowAttendance && (
          <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, #eab308 18%, transparent)", color: "#a16207", border: "1px solid #eab308" }}>
            <span className="material-symbols-outlined">warning</span>
            Attendance is below 75%. Review subject-wise gaps and contact your mentor if a correction is needed.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="percent" label="Overall" value={loading ? "..." : `${overall.percentage || 0}%`} sublabel={`${overall.present || 0}/${overall.total || 0} present`} />
          <StatCard icon="check_circle" label="Present" value={overall.present || 0} color="#16a34a" />
          <StatCard icon="cancel" label="Absent" value={overall.absent || 0} color="var(--error)" />
          <StatCard icon="pending_actions" label="Leave/Pending" value={(overall.leave || 0) + (overall.pending || 0)} color="#ca8a04" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Subject Attendance</h2>
            <div className="space-y-4">
              {(summary?.subjectWise || []).map((item) => (
                <div key={item.subjectId} className="rounded-lg p-4" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--on-surface)" }}>{item.subjectName}</p>
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{item.subjectCode} · {item.present}/{item.total} present</p>
                    </div>
                    <span className="text-lg font-bold" style={{ color: item.percentage < 75 ? "#ca8a04" : "var(--primary)" }}>{item.percentage}%</span>
                  </div>
                  <ProgressBar value={item.percentage} color={item.percentage < 75 ? "#eab308" : "var(--primary)"} />
                </div>
              ))}
              {!loading && !summary?.subjectWise?.length && <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>No attendance records yet.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Monthly Trend</h2>
            <MiniBarChart data={summary?.monthly || []} />
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>History</h2>
            <div className="flex flex-wrap gap-2">
              <select value={correctionId} onChange={(e) => setCorrectionId(e.target.value)} className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                <option value="">Select record</option>
                {history.map((record) => (
                  <option key={record.id} value={record.id}>{new Date(record.date).toLocaleDateString()} · {record.subjectName} · {record.status}</option>
                ))}
              </select>
              <input value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} placeholder="Correction reason" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
              <button type="button" onClick={requestCorrection} className="btn-primary inline-flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base">edit_note</span>
                Request
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  {["Date", "Subject", "Mentor", "Status", "Remarks", "Correction"].map((head) => (
                    <th key={head} className="pb-3 pr-4 text-xs uppercase" style={{ color: "var(--on-surface-variant)" }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    <td className="py-3 pr-4 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">{record.subjectName}</td>
                    <td className="py-3 pr-4">{record.mentorName || "-"}</td>
                    <td className="py-3 pr-4"><StatusBadge status={record.status} /></td>
                    <td className="py-3 pr-4">{record.remarks || "-"}</td>
                    <td className="py-3 pr-4">{record.correction?.status === "NONE" ? "-" : record.correction?.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}

function MentorAttendance() {
  const { auth } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", section: "" });
  const [sessionForm, setSessionForm] = useState({ subjectId: "", date: new Date().toISOString().slice(0, 10), title: "" });

  const loadBase = useCallback(async () => {
    setError("");
    try {
      const [subjectsRes, sessionsRes, statsRes] = await Promise.all([
        api.get("/attendance/subjects"),
        api.get("/attendance/sessions"),
        api.get(auth?.role === "ADMIN" ? "/attendance/admin/stats" : "/attendance/mentor/stats"),
      ]);
      setSubjects(subjectsRes.data);
      setSessions(sessionsRes.data);
      setStats(statsRes.data);
      if (!selectedId && sessionsRes.data[0]) setSelectedId(sessionsRes.data[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load attendance management."));
    }
  }, [auth?.role, selectedId]);

  const loadSession = useCallback(async () => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    try {
      const { data } = await api.get(`/attendance/sessions/${selectedId}`);
      setSelected(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load session."));
    }
  }, [selectedId]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { loadSession(); }, [loadSession]);
  useEffect(() => {
    const id = setInterval(() => {
      loadBase();
      loadSession();
    }, 8000);
    return () => clearInterval(id);
  }, [loadBase, loadSession]);

  const records = useMemo(() => selected?.records || [], [selected?.records]);
  const visibleRecords = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((record) => {
      const matchesStatus = statusFilter === "ALL" || record.status === statusFilter;
      const matchesSearch = !q || record.studentName?.toLowerCase().includes(q) || record.rollNo?.toLowerCase().includes(q) || record.studentEmail?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [records, search, statusFilter]);

  const createSubject = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/attendance/subjects", subjectForm);
      setSubjects((items) => [...items, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSubjectForm({ name: "", code: "", section: "" });
      setMessage("Subject created.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create subject."));
    }
  };

  const createSession = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/attendance/sessions", sessionForm);
      setSessions((items) => [data, ...items]);
      setSelectedId(data.id);
      setSelected(data);
      setMessage("Attendance session created.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create session."));
    }
  };

  const updateRecordLocal = (id, patch) => {
    setSelected((current) => ({
      ...current,
      records: current.records.map((record) => (record.id === id ? { ...record, ...patch } : record)),
    }));
  };

  const saveRecords = async () => {
    if (!selected) return;
    setError("");
    try {
      const { data } = await api.put(`/attendance/sessions/${selected.id}/records`, {
        records: selected.records.map((record) => ({
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks,
        })),
      });
      setSelected(data);
      await loadBase();
      setMessage("Attendance saved.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save attendance."));
    }
  };

  const markAllPresent = async () => {
    if (!selected) return;
    try {
      const { data } = await api.put(`/attendance/sessions/${selected.id}/mark-all-present`);
      setSelected(data);
      await loadBase();
      setMessage("All students marked present.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to mark all present."));
    }
  };

  const lockSession = async () => {
    if (!selected) return;
    try {
      const { data } = await api.put(`/attendance/sessions/${selected.id}/lock`);
      setSelected(data);
      await loadBase();
      setMessage("Attendance locked.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to lock attendance."));
    }
  };

  const resolveCorrection = async (record, approved) => {
    try {
      await api.put(`/attendance/records/${record.id}/correction/resolve`, {
        approved,
        status: approved ? record.status : undefined,
        response: approved ? "Correction approved" : "Correction rejected",
      });
      await loadSession();
      setMessage(`Correction ${approved ? "approved" : "rejected"}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to resolve correction."));
    }
  };

  const exportSession = () => {
    if (!selected) return;
    downloadCsv("attendance-session.csv", [
      ["Date", "Subject", "Student", "Roll No", "Email", "Status", "Remarks"],
      ...records.map((record) => [
        new Date(selected.date).toLocaleDateString(),
        selected.subjectName,
        record.studentName,
        record.rollNo,
        record.studentEmail,
        record.status,
        record.remarks,
      ]),
    ]);
  };

  return (
    <AppShell title={auth?.role === "ADMIN" ? "Attendance Analytics" : "Attendance Management"}>
      <main className="max-w-7xl mx-auto px-2 pb-6 pt-2 space-y-6">
        {(message || error) && (
          <div className="rounded-lg px-4 py-3 text-sm" style={error ? { background: "var(--error-container)", color: "var(--on-error-container)" } : { background: "color-mix(in srgb, #16a34a 14%, transparent)", color: "#15803d" }}>
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="event_available" label="Sessions" value={stats?.sessions ?? 0} />
          <StatCard icon="groups" label="Marked Records" value={stats?.students ?? 0} />
          <StatCard icon="check_circle" label="Present" value={stats?.present ?? 0} color="#16a34a" />
          <StatCard icon="percent" label="Class Average" value={`${stats?.percentage ?? 0}%`} color="#0ea5e9" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Create Subject</h2>
            <form onSubmit={createSubject} className="space-y-3">
              <input required value={subjectForm.name} onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))} placeholder="Subject name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
              <input required value={subjectForm.code} onChange={(e) => setSubjectForm((f) => ({ ...f, code: e.target.value }))} placeholder="Subject code" className="w-full rounded-lg px-3 py-2 text-sm uppercase outline-none" style={inputStyle} />
              <input value={subjectForm.section} onChange={(e) => setSubjectForm((f) => ({ ...f, section: e.target.value }))} placeholder="Section" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
              <button className="btn-secondary inline-flex w-full items-center justify-center gap-2 text-sm" type="submit">
                <span className="material-symbols-outlined text-base">add</span>
                Add Subject
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Create Session</h2>
            <form onSubmit={createSession} className="space-y-3">
              <select required value={sessionForm.subjectId} onChange={(e) => setSessionForm((f) => ({ ...f, subjectId: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                <option value="">Select subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
              </select>
              <input type="date" required value={sessionForm.date} onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
              <input value={sessionForm.title} onChange={(e) => setSessionForm((f) => ({ ...f, title: e.target.value }))} placeholder="Session title" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
              <button className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm" type="submit">
                <span className="material-symbols-outlined text-base">post_add</span>
                Create Session
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--on-surface)" }}>Sessions</h2>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {sessions.map((session) => (
                <button key={session.id} type="button" onClick={() => setSelectedId(session.id)} className="w-full rounded-lg p-3 text-left text-sm" style={selectedId === session.id ? { background: "var(--primary)", color: "var(--on-primary)" } : inputStyle}>
                  <span className="block font-semibold">{session.subjectName}</span>
                  <span className="text-xs opacity-80">{new Date(session.date).toLocaleDateString()} · {session.percentage}% · {session.locked ? "Locked" : "Open"}</span>
                </button>
              ))}
              {!sessions.length && <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>No sessions yet.</p>}
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>{selected ? `${selected.subjectName} Attendance` : "Attendance Records"}</h2>
              {selected && <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{new Date(selected.date).toLocaleDateString()} · {selected.groupName || "Class"} · {selected.locked ? "Locked" : "Open"}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {["ALL", "PRESENT", "ABSENT", "LEAVE", "PENDING"].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <button type="button" onClick={markAllPresent} disabled={!selected || selected.locked} className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50">
                <span className="material-symbols-outlined text-base">done_all</span>
                All Present
              </button>
              <button type="button" onClick={saveRecords} disabled={!selected || selected.locked} className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50">
                <span className="material-symbols-outlined text-base">save</span>
                Save
              </button>
              <button type="button" onClick={lockSession} disabled={!selected || selected.locked} className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50">
                <span className="material-symbols-outlined text-base">lock</span>
                Lock
              </button>
              <button type="button" onClick={exportSession} disabled={!selected} className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50">
                <span className="material-symbols-outlined text-base">download</span>
                CSV
              </button>
            </div>
          </div>

          {selected && (
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {["PRESENT", "ABSENT", "LEAVE", "PENDING"].map((status) => (
                <div key={status} className="rounded-lg p-3" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
                  <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{status}</p>
                  <p className="text-xl font-bold">{selected.counts?.[status] || 0}</p>
                </div>
              ))}
              <div className="rounded-lg p-3" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>RATE</p>
                <p className="text-xl font-bold">{selected.percentage}%</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  {["Student", "Roll No", "Status", "Remarks", "Correction"].map((head) => (
                    <th key={head} className="pb-3 pr-4 text-xs uppercase" style={{ color: "var(--on-surface-variant)" }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                    <td className="py-3 pr-4">
                      <span className="block font-medium">{record.studentName}</span>
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{record.studentEmail}</span>
                    </td>
                    <td className="py-3 pr-4">{record.rollNo || "-"}</td>
                    <td className="py-3 pr-4">
                      <select disabled={selected?.locked} value={record.status} onChange={(e) => updateRecordLocal(record.id, { status: e.target.value })} className="rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-70" style={inputStyle}>
                        {["PRESENT", "ABSENT", "LEAVE", "PENDING"].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <input disabled={selected?.locked} value={record.remarks || ""} onChange={(e) => updateRecordLocal(record.id, { remarks: e.target.value })} className="min-w-48 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-70" style={inputStyle} />
                    </td>
                    <td className="py-3 pr-4">
                      {record.correction?.status === "PENDING" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{record.correction.reason}</span>
                          <button type="button" onClick={() => resolveCorrection(record, true)} className="rounded-md px-2 py-1 text-xs" style={{ background: "#16a34a", color: "white" }}>Approve</button>
                          <button type="button" onClick={() => resolveCorrection(record, false)} className="rounded-md px-2 py-1 text-xs" style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}>Reject</button>
                        </div>
                      ) : (
                        record.correction?.status === "NONE" ? "-" : record.correction?.status
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selected && !visibleRecords.length && <p className="py-8 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>No matching students.</p>}
            {!selected && <p className="py-8 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>Select or create a session to mark attendance.</p>}
          </div>
        </Card>
      </main>
    </AppShell>
  );
}

export default function Attendance() {
  const { auth } = useAuth();
  return auth?.role === "STUDENT" ? <StudentAttendance /> : <MentorAttendance />;
}
