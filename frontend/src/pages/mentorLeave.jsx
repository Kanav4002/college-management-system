import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";

const MentorLeave = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [calendar, setCalendar] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const BASE_URL = "http://localhost:8080/api/leaves";

  // 🔥 FETCH LEAVES
  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${BASE_URL}/assigned`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeaves(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    renderCal();
    fetchLeaves();
  }, [month, year]);

  // 📅 CALENDAR
  const renderCal = () => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    let cal = [];

    for (let i = 0; i < first; i++) cal.push(null);

    for (let d = 1; d <= total; d++) {
      cal.push({ day: d });
    }

    setCalendar(cal);
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  // ⭐ RANGE LOGIC
  const isInRange = (day) => {
    if (!selectedLeave) return false;

    const date = new Date(year, month, day);
    const start = new Date(selectedLeave.startDate);
    const end = new Date(selectedLeave.endDate);

    return date >= start && date <= end;
  };

  const isSelected = (day) => {
    if (!selectedLeave) return false;

    const date = new Date(year, month, day);
    const start = new Date(selectedLeave.startDate);
    const end = new Date(selectedLeave.endDate);

    return (
      date.getTime() === start.getTime() ||
      date.getTime() === end.getTime()
    );
  };

  // ✅ APPROVE
  const approveLeave = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(`${BASE_URL}/${id}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchLeaves();
    } catch (err) {
      alert("Error approving");
    }
  };

  // ❌ REJECT
  const rejectLeave = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(`${BASE_URL}/${id}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchLeaves();
    } catch (err) {
      alert("Error rejecting");
    }
  };

  // 📊 STATS
  const pending = leaves.filter(l => l.status === "PENDING").length;
  const approved = leaves.filter(l => l.status === "APPROVED").length;
  const rejected = leaves.filter(l => l.status === "REJECTED").length;

  return (
    <>
      <Navbar title="Mentor Leave Dashboard" showBack={true} />

      {/* 🔥 CENTERED CONTAINER */}
      <div className="p-6 flex justify-center">
        <div className="w-full md:w-[70%]">

          {/* 📊 STATS */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl shadow-sm text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              Pending <br /> <span className="text-xl font-bold">{pending}</span>
            </div>

            <div className="p-4 rounded-2xl shadow-sm text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              Approved <br /> <span className="text-xl font-bold">{approved}</span>
            </div>

            <div className="p-4 rounded-2xl shadow-sm text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              Rejected <br /> <span className="text-xl font-bold">{rejected}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* 📋 LEAVE LIST */}
            <div className="p-4 rounded-2xl shadow-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

              <h3 className="mb-4 font-semibold">Student Leaves</h3>

              {leaves.length === 0 && <p>No leaves</p>}

              {leaves.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLeave(l)}
                  className="border p-3 mb-3 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <p><strong>{l.studentName}</strong></p>
                  <p>{l.leaveType}</p>
                  <p>{l.startDate} → {l.endDate}</p>
                  <p className="text-sm text-gray-600">{l.reason}</p>
                  <p className="mt-1 font-medium">Status: {l.status}</p>

                  {l.status === "PENDING" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveLeave(l.id);
                        }}
                      >
                        Approve
                      </button>

                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectLeave(l.id);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 📅 CALENDAR */}
            <div className="p-4 rounded-2xl shadow-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

              {selectedLeave && (
                <p className="mb-3 text-sm">
                  Viewing: <b>{selectedLeave.studentName}</b> ({selectedLeave.days} days)
                </p>
              )}

              <div className="mb-4 flex justify-between">
                <button onClick={prevMonth}>◀</button>
                <span className="font-semibold">{months[month]} {year}</span>
                <button onClick={nextMonth}>▶</button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center">
                {days.map(d => <div key={d} className="font-medium">{d}</div>)}

                {calendar.map((c, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded border 
                      ${isSelected(c?.day) ? "bg-blue-600 text-white" : ""}
                      ${isInRange(c?.day) ? "bg-blue-200" : ""}
                    `}
                  >
                    {c?.day}
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
};

export default MentorLeave;