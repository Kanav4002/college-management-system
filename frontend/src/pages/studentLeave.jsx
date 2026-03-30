import { useEffect, useState } from "react";

function StudentDutyLeave() {
  const [yr, setYr] = useState(2023);
  const [mo, setMo] = useState(4);
  const [calendar, setCalendar] = useState([]);

  const DNS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MNS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const S = 19, E = 24;

  useEffect(() => {
    renderCal();
  }, [mo, yr]);

  const renderCal = () => {
    const first = new Date(yr, mo, 1).getDay();
    const total = new Date(yr, mo + 1, 0).getDate();

    let cal = [];

    for (let i = 0; i < first; i++) cal.push(null);

    for (let d = 1; d <= total; d++) {
      let type = "";
      if (mo === 4 && yr === 2023 && d >= S && d <= E) {
        type = (d === S || d === E) ? "se" : "rng";
      }
      cal.push({ day: d, type });
    }

    setCalendar(cal);
  };

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

  const submitForm = () => {
    alert("Leave request submitted!");
  };

  return (
    <div className="p-6">
      <h2>Student Duty Leave</h2>

      <div className="mt-4">
        <button onClick={pm}>◀</button>
        <span className="mx-4">{MNS[mo]} {yr}</span>
        <button onClick={nm}>▶</button>
      </div>

      <div className="grid grid-cols-7 mt-4">
        {DNS.map(d => <div key={d}>{d}</div>)}

        {calendar.map((c, i) => (
          <div key={i} className={`p-2 ${c?.type}`}>
            {c?.day}
          </div>
        ))}
      </div>

      <button onClick={() => alert("Draft saved!")}>Save Draft</button>
      <button onClick={submitForm}>Submit</button>
    </div>
  );
}

export default StudentDutyLeave;