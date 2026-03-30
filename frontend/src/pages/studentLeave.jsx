import React, { useEffect, useState } from "react";

const DutyLeave = () => {
  const [yr, setYr] = useState(2023);
  const [mo, setMo] = useState(4);
  const [calendar, setCalendar] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const [notify, setNotify] = useState("Yes");
  const [checked, setChecked] = useState(true);

  const DNS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MNS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const S = 19, E = 24;

  const renderCal = () => {
    let cal = [];

    DNS.forEach(d => cal.push({ type: "dn", value: d }));

    const first = new Date(yr, mo, 1).getDay();
    const tot = new Date(yr, mo + 1, 0).getDate();

    for (let i = 0; i < first; i++) {
      cal.push({ type: "empty" });
    }

    for (let d = 1; d <= tot; d++) {
      let cls = "d";

      if (mo === 4 && yr === 2023 && d >= S && d <= E) {
        cls += (d === S || d === E) ? " se" : " rng";
      }

      cal.push({ type: "date", value: d, className: cls });
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

  const saveDraft = () => alert("Draft saved!");
  const submitForm = () => {
    if (!checked) return alert("Please confirm first");
    alert("Leave request submitted!");
  };

  return (
    <>
      {/* CSS INSIDE COMPONENT */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;background:#f4f6fb}
        .page{max-width:900px;margin:0 auto;padding:2rem}
        .top-bar{display:flex;justify-content:space-between;margin-bottom:1.5rem}
        .avatar{width:44px;height:44px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-weight:700;color:#185FA5}

        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:1rem}
        .stat{background:#fff;border-radius:12px;padding:1rem;text-align:center}
        .num{font-size:22px;font-weight:700;color:#185FA5}
        .lbl{font-size:11px;color:#888}

        .card{background:#fff;border-radius:12px;padding:1.5rem}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .field{margin-bottom:1rem}
        .label{font-size:12px;color:#666}

        input,select,textarea{
          width:100%;padding:8px;border-radius:8px;border:1px solid #ccc;background:#f9faff
        }

        .date-row{display:flex;gap:5px}
        .cal-wrap{background:#f9faff;padding:1rem;border-radius:12px}
        .cgrid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}
        .dn{font-size:10px;color:#aaa}
        .d{padding:5px;border-radius:6px}
        .d.rng{background:#dbeafe}
        .d.se{background:#185FA5;color:#fff}

        .tags{display:flex;gap:6px}
        .tag{padding:5px 10px;border-radius:20px;border:1px solid #ccc;cursor:pointer}
        .tag.on{background:#185FA5;color:#fff}

        .btn-row{display:flex;justify-content:flex-end;gap:10px;margin-top:1rem}
        .btn{padding:10px 20px;border-radius:8px;border:none;cursor:pointer}
        .btn-o{background:#fff;border:1px solid #ccc}
        .btn-p{background:#185FA5;color:#fff}
      `}</style>

      <div className="page">
        <div className="top-bar">
          <div>
            <h2>Hi, Student</h2>
            <p>Duty Leave Form</p>
          </div>
          <div className="avatar">ST</div>
        </div>

        <div className="stats">
          <div className="stat"><div className="num">5</div><div className="lbl">Days</div></div>
          <div className="stat"><div className="num">08/30</div></div>
          <div className="stat"><div className="num">22/30</div></div>
        </div>

        <div className="card">
          <div className="grid2">
            <div>
              <input placeholder="Name" />
              <input placeholder="Roll No" />

              <select>
                <option>Duty Leave</option>
              </select>

              <div className="date-row">
                <input defaultValue="19/05/2023"/>
                <input defaultValue="24/05/2023"/>
              </div>

              <textarea placeholder="Reason"></textarea>

              <div className="tags">
                {["Low","Medium","High"].map(p=>(
                  <span key={p} className={`tag ${priority===p?"on":""}`} onClick={()=>setPriority(p)}>{p}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="cal-wrap">
                <div>
                  <button onClick={pm}>‹</button>
                  {MNS[mo]} {yr}
                  <button onClick={nm}>›</button>
                </div>

                <div className="cgrid">
                  {calendar.map((item,i)=>{
                    if(item.type==="dn") return <div key={i}>{item.value}</div>
                    if(item.type==="empty") return <div key={i}></div>
                    return <div key={i} className={item.className}>{item.value}</div>
                  })}
                </div>
              </div>

              <div className="tags">
                {["Yes","No"].map(n=>(
                  <span key={n} className={`tag ${notify===n?"on":""}`} onClick={()=>setNotify(n)}>{n}</span>
                ))}
              </div>

              <input type="checkbox" checked={checked} onChange={()=>setChecked(!checked)} />
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-o" onClick={saveDraft}>Save</button>
            <button className="btn btn-p" onClick={submitForm}>Submit</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DutyLeave;