import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ComplaintDetailModal from "../components/ComplaintDetailModal";
import api from "../api/api";

/* ── Style maps ───────────────────────────────────────────────── */
const statusStyles = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED:   "bg-gray-200 text-gray-600",
};

const priorityStyles = {
  LOW:    "bg-gray-100 text-gray-600",
  MEDIUM: "bg-orange-100 text-orange-600",
  HIGH:   "bg-red-100 text-red-600",
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/* ── Horizontal bar chart ─────────────────────────────────────── */
function HorizontalBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No data yet</p>;
  }
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-4">
      {entries.map(([label, count]) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{count}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--chart-track)" }}>
            <div className="h-full rounded-full bg-[#0088D1] transition-all" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Card helper ──────────────────────────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl shadow-sm p-6 ${className}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

/* ── Clickable Complaint Row (opens modal) ────────────────────── */
function ComplaintRow({ complaint: c, onClick, showStudent = false }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer rounded-xl transition-all duration-150 hover:shadow-md"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-muted)" }} title={c.id}>#{String(c.id).slice(-6)}</span>

      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        title={c.priority}
        style={{ background: c.priority === "HIGH" ? "#ef4444" : c.priority === "MEDIUM" ? "#f59e0b" : "#9ca3af" }}
      />

      <span className="flex-1 font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
        {c.title}
      </span>

      {showStudent && (
        <span className="hidden sm:inline text-xs shrink-0 max-w-[120px] truncate" style={{ color: "var(--text-secondary)" }}>
          {c.studentName}
        </span>
      )}

      <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
        {c.issueType || c.category}
      </span>

      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${statusStyles[c.status]}`}>
        {c.status}
      </span>

      {c.assignedDepartment && !showStudent && (
        <span className="hidden lg:inline text-[11px] font-medium shrink-0 px-2 py-0.5 rounded-md" style={{ background: "var(--bg-input)", color: "var(--accent, var(--text-secondary))" }}>
          {c.assignedDepartment}
        </span>
      )}

      <span className="hidden lg:inline text-[11px] shrink-0 w-20 text-right" style={{ color: "var(--text-muted)" }}>
        {new Date(c.createdAt).toLocaleDateString()}
      </span>

      <svg
        className="w-4 h-4 shrink-0"
        style={{ color: "var(--text-muted)" }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
function MentorPanel() {
  const { auth } = useAuth();
  const [tab, setTab] = useState("review");
  const [complaints, setComplaints] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Search / sort / filter — separate for each tab */
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewFilter, setReviewFilter] = useState("ALL");

  const [mySearch, setMySearch] = useState("");
  const [mySort, setMySort] = useState("newest");
  const [myFilter, setMyFilter] = useState("ALL");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalRole, setModalRole] = useState("MENTOR"); // MENTOR for review tab, view-only for "my" tab

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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  /* ── Review tab computed ──────────────────────────────────── */
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

  /* ── My tab computed ──────────────────────────────────────── */
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
    { label: "Total Assigned", value: stats?.total ?? "–", iconBg: "#0088D1",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: "Pending Review", value: stats?.pending ?? "–", iconBg: "#eab308",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Approved", value: stats?.approved ?? "–", iconBg: "#22c55e",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Rejected", value: stats?.rejected ?? "–", iconBg: "#ef4444",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  /* ── Reusable search + sort + filter toolbar ────────────── */
  function Toolbar({ search, onSearch, sort, onSort, filter, onFilter, counts, filterKeys, total, visibleCount }) {
    return (
      <div className="px-5 pt-5 pb-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {tab === "review" ? "Assigned Complaints" : "My Submitted Complaints"}
            <span className="text-sm font-normal ml-2" style={{ color: "var(--text-muted)" }}>
              {visibleCount} of {total}
            </span>
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search complaints…"
                className="text-sm py-2 pl-9 pr-3 rounded-lg w-56 outline-none focus:ring-2 focus:ring-[#0088D1]/30 transition"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            <select
              value={sort}
              onChange={(e) => onSort(e.target.value)}
              className="text-sm py-2 px-3 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-[#0088D1]/30 transition"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
              className={`px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer ${filter === f ? "bg-[#0088D1] text-white" : ""}`}
              style={filter !== f ? { background: "var(--bg-input)", color: "var(--text-secondary)" } : {}}
            >
              {f} ({counts[f] ?? 0})
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty / Loading states ──────────────────────────────── */
  function EmptyState({ searchTerm, message }) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {searchTerm ? `No complaints matching "${searchTerm}"` : message}
        </p>
      </div>
    );
  }

  function LoadingState() {
    return (
      <div className="flex items-center justify-center py-12 gap-3" style={{ color: "var(--text-muted)" }}>
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm">Loading complaints…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <Navbar title="Mentor Assignment Panel" showBack />

      <main className="max-w-7xl mx-auto px-6 pb-12 pt-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl p-5 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ background: card.iconBg }}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{card.label}</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Handled Complaints by Category</h2>
          <HorizontalBarChart data={stats?.byCategory} />
        </Card>

        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Tab switcher + Submit button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("review")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${tab === "review" ? "bg-[#0088D1] text-white" : ""}`}
              style={tab !== "review" ? { background: "var(--bg-input)", color: "var(--text-secondary)" } : {}}
            >
              Student Complaints ({complaints.length})
            </button>
            <button
              onClick={() => setTab("my")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${tab === "my" ? "bg-[#0088D1] text-white" : ""}`}
              style={tab !== "my" ? { background: "var(--bg-input)", color: "var(--text-secondary)" } : {}}
            >
              My Complaints ({myComplaints.length})
            </button>
          </div>
          <Link
            to="/submit-complaint"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088D1] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Submit Complaint
          </Link>
        </div>

        {/* ── Tab: Student Complaints (review) ─────────────────── */}
        {tab === "review" && (
          <div className="rounded-xl shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
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

        {/* ── Tab: My Complaints (mentor's own submissions) ──── */}
        {tab === "my" && (
          <div className="rounded-xl shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
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
                  message={<>You haven&apos;t submitted any complaints yet. <Link to="/submit-complaint" className="text-[#0088D1] hover:underline">Submit one now →</Link></>}
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

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          role={modalRole}
          onAction={modalRole === "MENTOR" ? (id, action) => act(id, action) : undefined}
          acting={actionId === selectedComplaint.id}
        />
      )}
    </div>
  );
}

export default MentorPanel;
