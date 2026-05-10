import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { getAnnouncements } from '../api/announcementApi';

const CATEGORIES = ['All', 'Event', 'Holiday', 'Exam', 'Opportunities', 'Other'];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        setError('');

        const params = {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(category !== 'All' ? { category } : {}),
        };

        const response = await getAnnouncements(params);
        setAnnouncements(response.data.data || []);
      } catch (err) {
        setError('Unable to load announcements. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, [search, category]);

  return (
    <AppShell title="Announcements">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-[1.8fr_1fr]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full px-4 py-3 rounded-2xl"
            placeholder="Search by title, summary, or content"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full px-4 py-3 rounded-2xl"
          >
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {loading && <p>Loading announcements…</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          {announcements.map((announcement) => (
            <article key={announcement._id} className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">
                    {announcement.category}
                  </p>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {announcement.title}
                  </h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-400">{announcement.summary}</p>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="glass-btn"
                  onClick={() => setSelected(announcement)}
                >
                  Read more
                </button>
              </div>
            </article>
          ))}
        </div>

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-panel glass-card" onClick={(e) => e.stopPropagation()}>
              <header className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {selected.category}
                  </p>
                  <h2 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                    {selected.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Published on {new Date(selected.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setSelected(null)}>
                  ✕
                </button>
              </header>

              <div className="mt-6 space-y-4">
                <div
                  className="announcement-content"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: '1.8',
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '8px 4px',
                    textAlign: 'left',
                  }}
                >
                  {selected.content}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
