import React, { useEffect, useState } from "react";
import AppShell from "../components/AppShell";

const DutyLeave = () => {
  const user = "Muskan";

  const today = new Date();
  const [yr, setYr] = useState(today.getFullYear());
  const [mo, setMo] = useState(today.getMonth());

  const [calendar, setCalendar] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [leaveHistory, setLeaveHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [leaveType, setLeaveType] = useState("Duty Leave");

  const totalLeaves = 30;

  const DNS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MNS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  /* -------- DATE LOGIC -------- */
  const handleDateClick = (day) => {
    const selected = new Date(yr, mo, day);

    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else {
      if (selected < startDate) {
        setEndDate(startDate);
        setStartDate(selected);
      } else {
        setEndDate(selected);
      }
    }
  };

  const isInRange = (d) => {
    if (!startDate || !endDate) return false;
    const date = new Date(yr, mo, d);
    return date >= startDate && date <= endDate;
  };

  const isSelected = (d) => {
    const date = new Date(yr, mo, d);
    return (
      (startDate && date.getTime() === startDate.getTime()) ||
      (endDate && date.getTime() === endDate.getTime())
    );
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
  };

  const usedLeaves = leaveHistory.reduce((acc, l) => acc + l.days, 0);
  const remainingLeaves = totalLeaves - usedLeaves;

  /* -------- CALENDAR -------- */
  const renderCal = () => {
    let cal = [];

    DNS.forEach(d => cal.push({ type: "dn", value: d }));

    const first = new Date(yr, mo, 1).getDay();
    const tot = new Date(yr, mo + 1, 0).getDate();

    for (let i = 0; i < first; i++) cal.push({ type: "empty" });

    for (let d = 1; d <= tot; d++) {
      cal.push({ type: "date", value: d });
    }

    setCalendar(cal);
  };

  useEffect(() => {
    renderCal();
  }, [mo, yr]);

  const pm = () => {
    if (mo === 0) {
      setMo(11);
      setYr(yr - 1);
    } else setMo(mo - 1);
  };

  const nm = () => {
    if (mo === 11) {
      setMo(0);
      setYr(yr + 1);
    } else setMo(mo + 1);
  };

  /* -------- SUBMIT -------- */
  const submitForm = () => {
    const days = calculateDays();
    if (days === 0) return alert("Select dates first");

    const newLeave = {
      id: Date.now(),
      type: leaveType,
      from: startDate.toDateString(),
      to: endDate.toDateString(),
      days
    };

    setLeaveHistory([...leaveHistory, newLeave]);
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <AppShell title="Student Leave Dashboard">

      <style>{`
        :root {
          --bg: var(--bg-body);
          --card: var(--bg-card);
          --text: var(--text-primary);
          --surface-border: var(--border);
          --accent-color: var(--accent);
          --accent-soft: var(--bg-elevated);
          --accent-range: color-mix(in srgb, var(--accent) 18%, white);
          --placeholder: var(--text-secondary);
        }

        .dark {
          --bg: var(--bg-body);
          --card: var(--bg-card);
          --text: var(--text-primary);
          --surface-border: var(--border);
          --accent-color: var(--accent);
          --accent-soft: var(--bg-elevated);
          --accent-range: color-mix(in srgb, var(--accent) 25%, black);
          --placeholder: var(--text-secondary);
        }

        .leave-root {
          color: var(--text);
          font-family: 'Inter', sans-serif;
        }

        .container {
          width: 60%;
          margin: auto;
          margin-top: 20px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat {
          background: color-mix(in srgb, var(--bg-card) 80%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .stat h2 {
          color: var(--accent-color);
        }

        .card {
          background: color-mix(in srgb, var(--bg-card) 82%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        input, textarea, select {
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 10px;
          border: 1px solid color-mix(in srgb, var(--surface-border) 55%, transparent);
          background: color-mix(in srgb, var(--card) 80%, transparent);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: inherit;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: var(--accent-color);
          background: color-mix(in srgb, var(--card) 85%, transparent);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent);
        }

        textarea {
          min-height: 100px;
        }

        .calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin-top: 10px;
        }

        .day {
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          background: color-mix(in srgb, var(--card) 60%, transparent);
          border: 1px solid color-mix(in srgb, var(--surface-border) 35%, transparent);
          transition: all 150ms ease;
        }

        .day:hover {
          background: color-mix(in srgb, var(--accent-soft) 70%, transparent);
          transform: translateY(-1px);
        }

        .selected {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
          box-shadow: 0 0 16px color-mix(in srgb, var(--accent-color) 40%, transparent);
        }

        .range {
          background: color-mix(in srgb, var(--accent-color) 15%, transparent);
          border-color: color-mix(in srgb, var(--accent-color) 40%, transparent);
        }

        .btn-row {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .btn {
          background: var(--accent-color);
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 0 24px color-mix(in srgb, var(--accent-color) 30%, transparent);
          transition: all 200ms ease;
        }

        .btn:hover {
          box-shadow: 0 0 32px color-mix(in srgb, var(--accent-color) 40%, transparent);
          transform: translateY(-1px);
        }

        .btn-outline {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid color-mix(in srgb, var(--accent-color) 50%, transparent);
          background: color-mix(in srgb, var(--accent-color) 8%, transparent);
          color: var(--accent-color);
          cursor: pointer;
          font-weight: 600;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: all 150ms ease;
        }

        .btn-outline:hover {
          background: color-mix(in srgb, var(--accent-color) 15%, transparent);
          border-color: color-mix(in srgb, var(--accent-color) 65%, transparent);
        }

        .btn-outline:hover {
          background: var(--accent-color);
          color: white;
        }

        .history {
          margin-top: 20px;
          padding: 15px;
          border-radius: 12px;
          background: var(--card);
          border: 1px solid var(--surface-border);
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--surface-border);
        }

        .history-item:last-child {
          border-bottom: none;
        }

        .days {
          color: var(--accent-color);
          font-weight: 600;
        }
          /* FIX PLACEHOLDER VISIBILITY */
        input::placeholder,
        textarea::placeholder {
        color: var(--placeholder);
        opacity: 1;
        }

        /* DARK MODE PLACEHOLDER */
        .dark input::placeholder,
        .dark textarea::placeholder {
         color: var(--placeholder);
        }
      `}</style>

      <div className="leave-root container">
        {/* STATS */}
        <div className="stats">
          <div className="stat">
            <h2>{calculateDays()}</h2>
            <p>Selected Days</p>
          </div>

          <div className="stat">
            <h2>{usedLeaves}/{totalLeaves}</h2>
            <p>Used Leaves</p>
          </div>

          <div className="stat">
            <h2>{remainingLeaves}/{totalLeaves}</h2>
            <p>Remaining Leaves</p>
          </div>
        </div>

        {/* FORM */}
        <div className="card">
          <div className="grid">
            <div>
              <input placeholder="Name" />
              <input placeholder="Roll No" />

              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option>Duty Leave</option>
                <option>Medical Leave</option>
                <option>Sick Leave</option>
              </select>

              <textarea placeholder="Reason"></textarea>
            </div>

            <div>
              <div>
                <button onClick={pm}>‹</button>
                <span style={{ margin: "0 10px" }}>
                  {MNS[mo]} {yr}
                </span>
                <button onClick={nm}>›</button>
              </div>

              <div className="calendar">
                {calendar.map((item, i) => {
                  if (item.type === "dn") return <div key={i}>{item.value}</div>;
                  if (item.type === "empty") return <div key={i}></div>;

                  return (
                    <div
                      key={i}
                      className={`day 
                        ${isSelected(item.value) ? "selected" : ""}
                        ${isInRange(item.value) ? "range" : ""}
                      `}
                      onClick={() => handleDateClick(item.value)}
                    >
                      {item.value}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="btn-row">
            <button className="btn" onClick={submitForm}>
              Submit Leave
            </button>

            <button
              className="btn-outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide Leave History" : "View Leave History"}
            </button>
          </div>

          {showHistory && (
            <div className="history">
              <h3>Leave History</h3>

              {leaveHistory.map((l) => (
                <div key={l.id} className="history-item">
                  <div>
                    <strong>{l.type}</strong> | {l.from} → {l.to}
                  </div>
                  <span className="days">{l.days} days</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default DutyLeave;