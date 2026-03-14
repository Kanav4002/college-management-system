import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../api/api";

/* ── Helpers ─────────────────────────────────────────────────────── */

function DetailField({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

/* ── Create / Edit Group Modal ───────────────────────────────────── */

function GroupModal({ group, mentors, onClose, onSave }) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [mentorId, setMentorId] = useState(group?.mentorId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { name, description, mentorId: mentorId ? Number(mentorId) : null };
      if (group) {
        await api.put(`/groups/${group.id}`, payload);
      } else {
        await api.post("/groups", payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to save group.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2 text-sm rounded-lg";
  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl shadow-xl w-full max-w-md p-6 mx-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          {group ? "Edit Group" : "Create New Group"}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-xl text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Group Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} style={inputStyle} placeholder="e.g. Computer Science Year 1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} style={inputStyle} placeholder="Optional description..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Assigned Mentor</label>
            <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">— No mentor —</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg cursor-pointer" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#0088D1] text-white cursor-pointer hover:opacity-90 transition disabled:opacity-50">
              {saving ? "Saving..." : group ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Add Member Modal ────────────────────────────────────────────── */

function AddMemberModal({ groupId, onClose, onSave }) {
  const [role, setRole] = useState("STUDENT");
  const [unassigned, setUnassigned] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/groups/unassigned/${role}`)
      .then((res) => { setUnassigned(res.data); setSelectedId(""); })
      .catch(() => setUnassigned([]));
  }, [role]);

  const handleAdd = async () => {
    if (!selectedId) return;
    setError("");
    setSaving(true);
    try {
      await api.post(`/groups/${groupId}/members/${selectedId}`);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to add member.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2 text-sm rounded-lg";
  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl shadow-xl w-full max-w-md p-6 mx-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Add Member</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-xl text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="STUDENT">Student</option>
              <option value="MENTOR">Mentor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Select User</label>
            {unassigned.length === 0 ? (
              <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No unassigned {role.toLowerCase()}s found.</p>
            ) : (
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">— Select —</option>
                {unassigned.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg cursor-pointer" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving || !selectedId} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#0088D1] text-white cursor-pointer hover:opacity-90 transition disabled:opacity-50">
              {saving ? "Adding..." : "Add Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Expandable Group Row ────────────────────────────────────────── */

function GroupRow({ group, isExpanded, onToggle, onEdit, onDelete, onAddMember }) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (isExpanded && members.length === 0) {
      setLoadingMembers(true);
      api.get(`/groups/${group.id}/members`)
        .then((res) => setMembers(res.data))
        .catch(() => {})
        .finally(() => setLoadingMembers(false));
    }
  }, [isExpanded, group.id, members.length]);

  const removeMember = async (userId) => {
    setRemovingId(userId);
    try {
      await api.delete(`/groups/${group.id}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch {
      // silently fail
    } finally {
      setRemovingId(null);
    }
  };

  const roleStyles = {
    STUDENT: "bg-blue-100 text-blue-600",
    MENTOR: "bg-indigo-100 text-indigo-600",
    ADMIN: "bg-gray-100 text-gray-600",
  };

  return (
    <div
      className="rounded-xl transition-all duration-200"
      style={{
        background: "var(--bg-card)",
        border: isExpanded ? "1px solid var(--accent, #0088D1)" : "1px solid var(--border)",
        boxShadow: isExpanded ? "0 4px 24px rgba(0,136,209,0.08)" : "none",
      }}
    >
      {/* Main row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer group transition-colors duration-150 rounded-xl"
        style={{ background: "transparent" }}
      >
        <span className="text-xs font-mono w-8 shrink-0" style={{ color: "var(--text-muted)" }}>#{group.id}</span>
        <span className="flex-1 font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{group.name}</span>
        <span className="hidden sm:inline text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
          {group.mentorName || "No mentor"}
        </span>
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 bg-blue-100 text-blue-600">
          {group.memberCount} members
        </span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded panel */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: isExpanded ? "800px" : "0px", opacity: isExpanded ? 1 : 0 }}
      >
        <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Group details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-4">
            <DetailField label="Name" value={group.name} />
            <DetailField label="Description" value={group.description || "—"} />
            <DetailField label="Mentor" value={group.mentorName ? `${group.mentorName} (${group.mentorEmail})` : "Not assigned"} />
            <DetailField label="Members" value={group.memberCount} />
            <DetailField label="Created" value={new Date(group.createdAt).toLocaleString()} />
            {group.updatedAt && <DetailField label="Updated" value={new Date(group.updatedAt).toLocaleString()} />}
          </div>

          {/* Members list */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Members</h3>
              <button
                onClick={() => onAddMember(group.id)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#0088D1] text-white cursor-pointer hover:opacity-90 transition"
              >
                + Add Member
              </button>
            </div>

            {loadingMembers ? (
              <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Loading members...</p>
            ) : members.length === 0 ? (
              <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No members in this group yet.</p>
            ) : (
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg-input)" }}
                  >
                    <div className="h-7 w-7 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0 flex items-center justify-center text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.email}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${roleStyles[m.role]}`}>{m.role}</span>
                    <button
                      onClick={() => removeMember(m.id)}
                      disabled={removingId === m.id}
                      className="text-red-500 hover:text-red-700 text-xs cursor-pointer disabled:opacity-50"
                      title="Remove from group"
                    >
                      {removingId === m.id ? "..." : "✕"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => onEdit(group)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(group.id)}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */

function GroupManagement() {
  const { auth } = useAuth();
  const [groups, setGroups] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, mentorsRes] = await Promise.all([
        api.get("/groups"),
        api.get("/groups/mentors"),
      ]);
      setGroups(groupsRes.data);
      setMentors(mentorsRes.data);
    } catch {
      setError("Failed to load groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group? All members will be unassigned.")) return;
    setError("");
    try {
      await api.delete(`/groups/${id}`);
      setSuccess("Group deleted successfully.");
      setTimeout(() => setSuccess(""), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Failed to delete group.");
    }
  };

  const filteredGroups = groups.filter((g) => {
    const s = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(s) ||
      (g.description || "").toLowerCase().includes(s) ||
      (g.mentorName || "").toLowerCase().includes(s) ||
      String(g.id).includes(s)
    );
  });

  const totalMembers = groups.reduce((acc, g) => acc + g.memberCount, 0);

  const statCards = [
    {
      label: "Total Groups", value: groups.length, iconBg: "#0088D1",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
    {
      label: "Total Members", value: totalMembers, iconBg: "#22c55e",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      label: "Mentors Assigned", value: groups.filter((g) => g.mentorId).length, iconBg: "#6366f1",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      label: "Unassigned Groups", value: groups.filter((g) => !g.mentorId).length, iconBg: "#eab308",
      icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      <Navbar title="Group Management" showBack />

      <main className="max-w-7xl mx-auto px-6 pb-12 pt-6 space-y-6">
        {/* Stat cards */}
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

        {/* Alerts */}
        {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {success}</div>}
        {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {error}</div>}

        {/* Header + search + create button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 text-sm rounded-lg"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button
            onClick={() => { setEditingGroup(null); setShowGroupModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088D1] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Group
          </button>
        </div>

        {/* Groups list */}
        {loading ? (
          <div className="flex items-center justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Loading groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="py-10 text-center" style={{ color: "var(--text-muted)" }}>
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="mt-2 text-sm">
              {searchTerm ? `No groups found matching "${searchTerm}".` : "No groups created yet. Click \"New Group\" to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                isExpanded={expandedId === g.id}
                onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
                onEdit={(grp) => { setEditingGroup(grp); setShowGroupModal(true); }}
                onDelete={handleDelete}
                onAddMember={(id) => setAddMemberGroupId(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          mentors={mentors}
          onClose={() => { setShowGroupModal(false); setEditingGroup(null); }}
          onSave={() => { setShowGroupModal(false); setEditingGroup(null); fetchData(); setSuccess(editingGroup ? "Group updated." : "Group created."); setTimeout(() => setSuccess(""), 4000); }}
        />
      )}

      {addMemberGroupId && (
        <AddMemberModal
          groupId={addMemberGroupId}
          onClose={() => setAddMemberGroupId(null)}
          onSave={() => { setAddMemberGroupId(null); fetchData(); setSuccess("Member added."); setTimeout(() => setSuccess(""), 4000); }}
        />
      )}
    </div>
  );
}

export default GroupManagement;
