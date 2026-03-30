import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

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
    <>
      <Navbar title="Student Leave Dashboard" showBack={true} />

      <style>{`
        :root {
          --bg: #f1f5f9;
          --card: white;
          --text: #000;
        }

        .dark {
          --bg: #0f172a;
          --card: #1e293b;
          --text: #e2e8f0;
        }

        body {
          background: var(--bg);
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
          background: var(--card);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .stat h2 {
          color: #2563eb;
        }

        .card {
          background: var(--card);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
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
          border: 1px solid #cbd5f5;
          background: transparent;
          color: inherit;
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
        }

        .day:hover {
          background: #e0e7ff;
        }

        .selected {
          background: #2563eb;
          color: white;
        }

        .range {
          background: #bfdbfe;
        }

        .btn-row {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .btn {
          background: #2563eb;
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
        }

        .btn-outline {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid #2563eb;
          background: transparent;
          color: #2563eb;
          cursor: pointer;
        }

        .btn-outline:hover {
          background: #2563eb;
          color: white;
        }

        .history {
          margin-top: 20px;
          padding: 15px;
          border-radius: 12px;
          background: var(--card);
          border: 1px solid #e2e8f0;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .history-item:last-child {
          border-bottom: none;
        }

        .days {
          color: #2563eb;
          font-weight: 600;
        }
          /* FIX PLACEHOLDER VISIBILITY */
        input::placeholder,
        textarea::placeholder {
        color: #64748b; /* darker gray for visibility */
        opacity: 1;
        }

        /* DARK MODE PLACEHOLDER */
        .dark input::placeholder,
        .dark textarea::placeholder {
         color: #94a3b8; /* lighter for dark bg */
        }
      `}</style>

      <div className="container">
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
    </>
  );
};

export default DutyLeave;