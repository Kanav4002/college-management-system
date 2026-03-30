import { useEffect, useState } from "react";

function EmployeeDutyLeave() {
  const [year, setYear] = useState(2023);
  const [month, setMonth] = useState(4);
  const [calendar, setCalendar] = useState([]);

  const startDay = 19;
  const endDay = 24;

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  useEffect(() => {
    renderCal();
  }, [month, year]);

  const renderCal = () => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    let cal = [];

    for (let i = 0; i < first; i++) cal.push(null);

    for (let d = 1; d <= total; d++) {
      let type = "";
      if (month === 4 && year === 2023 && d >= startDay && d <= endDay) {
        type = (d === startDay || d === endDay) ? "start-end" : "in-range";
      }
      cal.push({ day: d, type });
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

  return (
    <div className="p-6">
      <h2>Employee Duty Leave Request</h2>

      <div className="mt-4">
        <button onClick={prevMonth}>◀</button>
        <span className="mx-4">{months[month]} {year}</span>
        <button onClick={nextMonth}>▶</button>
      </div>

      <div className="grid grid-cols-7 mt-4">
        {days.map(d => <div key={d}>{d}</div>)}

        {calendar.map((c, i) => (
          <div key={i} className={`p-2 ${c?.type}`}>
            {c?.day}
          </div>
        ))}
      </div>

      <button onClick={() => alert("Draft saved!")}>Save Draft</button>
      <button onClick={() => alert("Request sent!")}>Submit</button>
    </div>
  );
}

export default EmployeeDutyLeave;