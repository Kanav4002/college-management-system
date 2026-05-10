import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../api/announcementApi';

const CATEGORY_OPTIONS = ['Event', 'Holiday', 'Exam', 'Opportunities', 'Other'];

const initialFormState = {
  title: '',
  summary: '',
  content: '',
  category: 'Event',
};

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await getAnnouncements();
        setAnnouncements(response.data.data || []);
      } catch {
        setMessage('Failed to load announcements.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const refreshAnnouncements = async () => {
    const response = await getAnnouncements();
    setAnnouncements(response.data.data || []);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (editingId) {
        await updateAnnouncement(editingId, form);
        setMessage('Announcement updated successfully.');
      } else {
        await createAnnouncement(form);
        setMessage('Announcement created successfully.');
      }
      resetForm();
      await refreshAnnouncements();
    } catch {
      setMessage('Unable to save announcement. Please check all fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement._id);
    setForm({
      title: announcement.title,
      summary: announcement.summary,
      content: announcement.content,
      category: announcement.category,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setSaving(true);
    try {
      await deleteAnnouncement(id);
      setMessage('Announcement deleted.');
      await refreshAnnouncements();
    } catch {
      setMessage('Unable to delete announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Manage Announcements">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </h2>

          {message && <p className="text-sm text-slate-600">{message}</p>}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <input
              value={form.title}
              onChange={(e) => setForm((state) => ({ ...state, title: e.target.value }))}
              placeholder="Title"
              className="glass-input w-full px-4 py-3 rounded-2xl"
              required
            />

            <textarea
              value={form.summary}
              onChange={(e) => setForm((state) => ({ ...state, summary: e.target.value }))}
              placeholder="Summary"
              className="glass-input w-full px-4 py-3 rounded-2xl min-h-[90px]"
              required
            />

            <textarea
              value={form.content}
              onChange={(e) => setForm((state) => ({ ...state, content: e.target.value }))}
              placeholder="Content"
              className="glass-input w-full px-4 py-3 rounded-2xl min-h-[140px]"
              required
            />

            <select
              value={form.category}
              onChange={(e) => setForm((state) => ({ ...state, category: e.target.value }))}
              className="glass-input w-full px-4 py-3 rounded-2xl"
              required
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="glass-btn" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Announcement' : 'Create Announcement'}
              </button>
              {editingId && (
                <button type="button" className="glass-btn" onClick={resetForm} disabled={saving}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Existing Announcements
          </h3>

          {loading && <p>Loading announcements…</p>}
          {!loading && announcements.length === 0 && <p>No announcements found.</p>}

          <div className="grid gap-4 lg:grid-cols-2">
            {announcements.map((announcement) => (
              <article key={announcement._id} className="glass-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {announcement.category}
                    </p>
                    <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {announcement.title}
                    </h4>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-3">{announcement.summary}</p>

                <div className="flex flex-wrap gap-3">
                  <button type="button" className="glass-btn" onClick={() => handleEdit(announcement)}>
                    Edit
                  </button>
                  <button type="button" className="glass-btn" onClick={() => handleDelete(announcement._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
