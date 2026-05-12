import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ComplaintDetailModal from "../components/ComplaintDetailModal";
import api from "../api/api";

/* ── Style maps ───────────────────────────────────────────────── */
const statusStyles = {
  PENDING:  { bg: "color-mix(in srgb, #eab308 15%, transparent)", text: "#b45309", border: "#eab308" },
  APPROVED: { bg: "color-mix(in srgb, var(--primary) 15%, transparent)", text: "var(--primary)", border: "var(--primary)" },
  REJECTED: { bg: "color-mix(in srgb, var(--error) 15%, transparent)", text: "var(--error)", border: "var(--error)" },
  ASSIGNED: { bg: "color-mix(in srgb, #6366f1 15%, transparent)", text: "#4338ca", border: "#6366f1" },
  RESOLVED: { bg: "color-mix(in srgb, #16a34a 15%, transparent)", text: "#15803d", border: "#16a34a" },
  CLOSED:   { bg: "var(--surface-container-high)", text: "var(--on-surface-variant)", border: "var(--outline)" },
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/* ── Horizontal bar chart ─────────────────────────────────────── */
function HorizontalBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--on-surface-variant)" }}>No data yet</p>;
  }
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-4">
      {entries.map(([label, count]) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>{label}</span>
            <span className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>{count}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--outline-variant)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(count / max) * 100}%`, background: "var(--primary)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Card helper ──────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

/* ── Clickable Complaint Row ────────────────────── */
function ComplaintRow({ complaint: c, onClick, showStudent = false }) {
  const status = statusStyles[c.status] || statusStyles.CLOSED;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-all duration-200 hover:bg-[--surface-container-low] rounded-lg"
      style={{ borderBottom: "1px solid var(--outline-variant)" }}
    >
      <span className="text-xs font-mono shrink-0" style={{ color: "var(--on-surface-variant)" }} title={c.id}>#{String(c.id).slice(-6)}</span>

      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        title={c.priority}
        style={{ background: c.priority === "HIGH" ? "var(--error)" : c.priority === "MEDIUM" ? "#f59e0b" : "var(--outline)" }}
      />

      <span className="flex-1 font-medium text-sm truncate" style={{ color: "var(--on-surface)" }}>
        {c.title}
      </span>

      {showStudent && (
        <span className="hidden sm:inline text-xs shrink-0 max-w-30 truncate" style={{ color: "var(--on-surface-variant)" }}>
          {c.studentName}
        </span>
      )}

      <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
        {c.issueType || c.category}
      </span>

      <span
        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0"
        style={{ background: status.bg, color: status.text }}
      >
        {c.status}
      </span>

      {c.assignedDepartment && !showStudent && (
        <span className="hidden lg:inline text-[11px] font-medium shrink-0 px-2 py-0.5 rounded-md" style={{ background: "var(--surface-container-low)", color: "var(--primary)" }}>
          {c.assignedDepartment}
        </span>
      )}

      <span className="hidden lg:inline text-[11px] shrink-0 w-20 text-right" style={{ color: "var(--on-surface-variant)" }}>
        {new Date(c.createdAt).toLocaleDateString()}
      </span>

      <span className="material-symbols-outlined text-lg shrink-0" style={{ color: "var(--on-surface-variant)" }}>
        chevron_right
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
function MentorPanel() {
  const [tab, setTab] = useState("review");
  const [complaints, setComplaints] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewFilter, setReviewFilter] = useState("ALL");

  const [mySearch, setMySearch] = useState("");
  const [mySort, setMySort] = useState("newest");
  const [myFilter, setMyFilter] = useState("ALL");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalRole, setModalRole] = useState("MENTOR");

  // Leave management state
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveStats, setLeaveStats] = useState(null);
  const [leaveActionId, setLeaveActionId] = useState(null);
  const [leaveError, setLeaveError] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState("");
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveFilter, setLeaveFilter] = useState("ALL");

  const fetchData = useCallback(async () => {
    try {
      const [complaintsRes, myRes, statsRes] = await Promise.all([
        api.get("/complaints/assigned"),
        api.get("/complaints/mentor/my"),
        api.get("/complaints/stats/mentor"),
      ]);
      setComplaints(complaintsRes.data);
      setMyComplaints(myRes.data);
      setStats(statsRes.data);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      const res = await api.get("/leaves/assigned");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setLeaveRequests(list);
    } catch (err) {
      setLeaveRequests([]);
      setLeaveError(err.response?.data?.message || "Failed to load leave requests.");
    } finally {
      setLeaveLoading(false);
    }
  }, []);

  const fetchLeaveStats = useCallback(async () => {
    try {
      const res = await api.get("/leaves/stats/mentor");
      setLeaveStats(res.data);
    } catch {
      setLeaveStats(null);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchLeaveRequests(); fetchLeaveStats(); }, [fetchLeaveRequests, fetchLeaveStats]);

  // Poll for complaints periodically so mentors see newly-submitted student complaints.
  useEffect(() => {
    const id = setInterval(() => fetchData(), 6000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Poll leave requests as well so student submissions show up without
  // requiring the mentor to reload the page.
  useEffect(() => {
    const id = setInterval(() => {
      fetchLeaveRequests();
      fetchLeaveStats();
    }, 6000);
    return () => clearInterval(id);
  }, [fetchLeaveRequests, fetchLeaveStats]);

  const act = async (id, action) => {
    setError(""); setSuccess(""); setActionId(id);
    try {
      const { data } = await api.put(`/complaints/${id}/${action}`);
      setComplaints((prev) => prev.map((c) => (c.id === id ? data : c)));
      setSelectedComplaint((prev) => (prev?.id === id ? data : prev));
      const msg = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated to admin";
      setSuccess(`Complaint #${id} ${msg}.`);
      setTimeout(() => setSuccess(""), 4000);
      const { data: newStats } = await api.get("/complaints/stats/mentor");
      setStats(newStats);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} complaint.`);
    } finally { setActionId(null); }
  };

  const actLeave = async (id, action) => {
    setLeaveError(""); setLeaveSuccess(""); setLeaveActionId(id);
    try {
      await api.put(`/leaves/${id}/${action}`);
      setLeaveRequests((prev) => prev.filter((l) => (l._id || l.id) !== id));
      setLeaveSuccess(`Leave request ${action}ed successfully.`);
      setTimeout(() => setLeaveSuccess(""), 4000);
      fetchLeaveStats();
    } catch (err) {
      setLeaveError(err.response?.data?.message || `Failed to ${action} leave request.`);
    } finally { setLeaveActionId(null); }
  };

  const reviewCounts = {
    ALL: complaints.length,
    PENDING: complaints.filter((c) => c.status === "PENDING").length,
    APPROVED: complaints.filter((c) => c.status === "APPROVED").length,
    REJECTED: complaints.filter((c) => c.status === "REJECTED").length,
    RESOLVED: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  const visibleReview = useMemo(() => {
    let list = reviewFilter === "ALL" ? [...complaints] : complaints.filter((c) => c.status === reviewFilter);

    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      list = list.filter((c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.studentName?.toLowerCase().includes(q) ||
        c.building?.toLowerCase().includes(q) ||
        c.issueType?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    }

    switch (reviewSort) {
      case "newest": list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case "oldest": list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case "priority": list.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)); break;
      case "status": list.sort((a, b) => a.status.localeCompare(b.status)); break;
      default: break;
    }
    return list;
  }, [complaints, reviewFilter, reviewSearch, reviewSort]);

  const myCounts = {
    ALL: myComplaints.length,
    ASSIGNED: myComplaints.filter((c) => c.status === "ASSIGNED").length,
    RESOLVED: myComplaints.filter((c) => c.status === "RESOLVED").length,
  };

  const visibleMy = useMemo(() => {
    let list = myFilter === "ALL" ? [...myComplaints] : myComplaints.filter((c) => c.status === myFilter);

    if (mySearch.trim()) {
      const q = mySearch.toLowerCase();
      list = list.filter((c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.building?.toLowerCase().includes(q) ||
        c.issueType?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.assignedDepartment?.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    }

    switch (mySort) {
      case "newest": list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case "oldest": list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case "priority": list.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)); break;
      case "status": list.sort((a, b) => a.status.localeCompare(b.status)); break;
      default: break;
    }
    return list;
  }, [myComplaints, myFilter, mySearch, mySort]);

  const statCards = [
    { label: "Total Assigned", value: stats?.total ?? "–", iconBg: "var(--primary)", icon: "groups" },
    { label: "Pending Review", value: stats?.pending ?? "–", iconBg: "#eab308", icon: "pending_actions" },
    { label: "Approved", value: stats?.approved ?? "–", iconBg: "#16a34a", icon: "check_circle" },
    { label: "Rejected", value: stats?.rejected ?? "–", iconBg: "var(--error)", icon: "cancel" },
  ];

  function Toolbar({ search, onSearch, sort, onSort, filter, onFilter, counts, filterKeys, total, visibleCount }) {
    return (
      <div className="px-5 pt-5 pb-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
            {tab === "review" ? "Assigned Complaints" : "My Submitted Complaints"}
            <span className="text-sm font-normal ml-2" style={{ color: "var(--on-surface-variant)" }}>
              {visibleCount} of {total}
            </span>
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: "var(--on-surface-variant)" }}>search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search complaints…"
                className="text-sm py-2 pl-10 pr-3 rounded-lg w-56 outline-none"
                style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
              />
            </div>

            <select
              value={sort}
              onChange={(e) => onSort(e.target.value)}
              className="text-sm py-2 px-3 rounded-lg outline-none cursor-pointer"
              style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Priority (High → Low)</option>
              <option value="status">Status (A → Z)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filterKeys.map((f) => (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className="px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer"
              style={filter === f ? { background: "var(--primary-container)", color: "var(--on-primary-container)" } : { background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
            >
              {f} ({counts[f] ?? 0})
            </button>
          ))}
        </div>
      </div>
    );
  }

  function EmptyState({ searchTerm, message }) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: "var(--on-surface-variant)" }}>search_off</span>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          {searchTerm ? `No complaints matching "${searchTerm}"` : message}
        </p>
      </div>
    );
  }

  function LoadingState() {
    return (
      <div className="flex items-center justify-center py-12 gap-3" style={{ color: "var(--on-surface-variant)" }}>
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        <span className="text-sm">Loading complaints…</span>
      </div>
    );
  }

  return (
    <AppShell title="Mentor Assignment Panel">
      <main className="max-w-7xl mx-auto px-2 pb-6 pt-2 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl p-5 shadow-sm" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ background: card.iconBg }}>
                  <span className="material-symbols-outlined text-xl text-white">{card.icon}</span>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{card.label}</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--on-surface)" }}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--on-surface)" }}>Handled Complaints by Category</h2>
          <HorizontalBarChart data={stats?.byCategory} />
        </Card>

        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, #16a34a 10%, transparent)", border: "1px solid #16a34a", color: "#15803d" }}>
            <span className="material-symbols-outlined">check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, var(--error) 10%, transparent)", border: "1px solid var(--error)", color: "var(--error)" }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Tab switcher + Submit button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("review")}
              className="px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer"
              style={tab === "review" ? { background: "var(--primary-container)", color: "var(--on-primary-container)" } : { background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
            >
              Complaints ({complaints.length})
            </button>
            <button
              onClick={() => setTab("leaves")}
              className="px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer"
              style={tab === "leaves" ? { background: "var(--primary-container)", color: "var(--on-primary-container)" } : { background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
            >
              Leave Requests ({leaveRequests.length})
            </button>
            <button
              onClick={() => setTab("my")}
              className="px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer"
              style={tab === "my" ? { background: "var(--primary-container)", color: "var(--on-primary-container)" } : { background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
            >
              My Complaints ({myComplaints.length})
            </button>
          </div>
          <Link
            to="/submit-complaint"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Submit Complaint
          </Link>
        </div>

        {tab === "review" && (
          <div className="rounded-xl shadow-sm" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <Toolbar
              search={reviewSearch} onSearch={setReviewSearch}
              sort={reviewSort} onSort={setReviewSort}
              filter={reviewFilter} onFilter={setReviewFilter}
              counts={reviewCounts}
              filterKeys={["ALL", "PENDING", "APPROVED", "REJECTED", "RESOLVED"]}
              total={complaints.length} visibleCount={visibleReview.length}
            />
            <div className="px-5 pb-5">
              {loading ? <LoadingState /> : visibleReview.length === 0 ? (
                <EmptyState searchTerm={reviewSearch} message="No complaints to review at the moment." />
              ) : (
                <div className="space-y-2">
                  {visibleReview.map((c) => (
                    <ComplaintRow
                      key={c.id}
                      complaint={c}
                      showStudent
                      onClick={() => { setSelectedComplaint(c); setModalRole("MENTOR"); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "leaves" && (
          <>
            {/* Leave Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--error) 20%, transparent)" }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: "var(--error)" }}>pending_actions</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Pending Requests</p>
                    <p className="text-2xl font-bold" style={{ color: "var(--on-surface)" }}>{leaveStats?.pending ?? leaveRequests.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "color-mix(in srgb, #4ade80 20%, transparent)" }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: "#4ade80" }}>check_circle</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Approved Today</p>
                    <p className="text-2xl font-bold" style={{ color: "var(--on-surface)" }}>{leaveStats?.approvedToday ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--secondary) 20%, transparent)" }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: "var(--secondary)" }}>groups</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Students on Leave</p>
                    <p className="text-2xl font-bold" style={{ color: "var(--on-surface)" }}>{leaveStats?.onLeave ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Alerts */}
            {leaveSuccess && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, #4ade80 10%, transparent)", border: "1px solid #4ade80", color: "#15803d" }}>
                <span className="material-symbols-outlined">check_circle</span>
                {leaveSuccess}
              </div>
            )}
            {leaveError && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, var(--error) 10%, transparent)", border: "1px solid var(--error)", color: "var(--error)" }}>
                <span className="material-symbols-outlined">error</span>
                {leaveError}
              </div>
            )}

            {/* Leave Requests List */}
            <div className="rounded-xl" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
              <div className="px-5 pt-5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                    Leave Approval Queue
                  </h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: "var(--on-surface-variant)" }}>search</span>
                      <input
                        type="text"
                        value={leaveSearch}
                        onChange={(e) => setLeaveSearch(e.target.value)}
                        placeholder="Search students..."
                        className="text-sm py-2 pl-10 pr-3 rounded-lg outline-none"
                        style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
                      />
                    </div>
                    <select
                      value={leaveFilter}
                      onChange={(e) => setLeaveFilter(e.target.value)}
                      className="text-sm py-2 px-3 rounded-lg outline-none cursor-pointer"
                      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
                    >
                      <option value="ALL">All Types</option>
                      <option value="Medical">Medical</option>
                      <option value="Personal">Personal</option>
                      <option value="Duty Leave">Duty Leave</option>
                      <option value="Academic">Academic</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                {leaveLoading ? (
                  <div className="flex items-center justify-center py-12 gap-3" style={{ color: "var(--on-surface-variant)" }}>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="text-sm">Loading leave requests...</span>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: "var(--on-surface-variant)" }}>calendar_today</span>
                    <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                      No pending leave requests to review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests
                      .filter(l => {
                        const matchesSearch = !leaveSearch ||
                          l.studentName?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
                          l.type?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
                          l.leaveType?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
                          l.reason?.toLowerCase().includes(leaveSearch.toLowerCase());
                        const matchesFilter = leaveFilter === "ALL" || l.type === leaveFilter || l.leaveType === leaveFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((leave) => (
                        <div
                          key={leave._id || leave.id}
                          className="rounded-xl p-4 md:p-6 transition-colors"
                          style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 rounded-full shrink-0" style={{ background: "var(--surface-container-high)" }}>
                                <span className="flex items-center justify-center h-full text-sm font-bold" style={{ color: "var(--on-surface-variant)" }}>
                                  {leave.studentName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-semibold" style={{ color: "var(--on-surface)" }}>
                                    {leave.studentName || "Student"}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ background: "color-mix(in srgb, var(--error) 15%, transparent)", color: "var(--error)" }}>
                                    {leave.urgency || "Normal"}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}>
                                    {leave.type || leave.leaveType}
                                  </span>
                                </div>
                                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                                  <span className="material-symbols-outlined text-base mr-1">schedule</span>
                                  {new Date(leave.from || leave.startDate).toLocaleDateString()} - {new Date(leave.to || leave.endDate).toLocaleDateString()} ({leave.days || leave.duration} Days)
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => actLeave(leave._id || leave.id, "approve")}
                                disabled={leaveActionId === (leave._id || leave.id)}
                                className="px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                                style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                              >
                                {leaveActionId === (leave._id || leave.id) ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => actLeave(leave._id || leave.id, "reject")}
                                disabled={leaveActionId === (leave._id || leave.id)}
                                className="px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                                style={{ background: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>

                          {leave.reason && (
                            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                              <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                                <strong>Reason:</strong> {leave.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === "my" && (
          <div className="rounded-xl shadow-sm" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <Toolbar
              search={mySearch} onSearch={setMySearch}
              sort={mySort} onSort={setMySort}
              filter={myFilter} onFilter={setMyFilter}
              counts={myCounts}
              filterKeys={["ALL", "ASSIGNED", "RESOLVED"]}
              total={myComplaints.length} visibleCount={visibleMy.length}
            />
            <div className="px-5 pb-5">
              {loading ? <LoadingState /> : visibleMy.length === 0 ? (
                <EmptyState
                  searchTerm={mySearch}
                  message={<>You haven't submitted any complaints yet. <Link to="/submit-complaint" style={{ color: "var(--primary)" }}>Submit one now →</Link></>}
                />
              ) : (
                <div className="space-y-2">
                  {visibleMy.map((c) => (
                    <ComplaintRow
                      key={c.id}
                      complaint={c}
                      onClick={() => { setSelectedComplaint(c); setModalRole("STUDENT"); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          role={modalRole}
          onAction={modalRole === "MENTOR" ? (id, action) => act(id, action) : undefined}
          acting={actionId === selectedComplaint.id}
        />
      )}
    </AppShell>
  );
}

export default MentorPanel;