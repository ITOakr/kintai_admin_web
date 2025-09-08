// src/pages/TimeEntrySearchPage.tsx

import { useState } from "react";
import { getEntries, getDaily } from "../lib/api";

type Entry = Awaited<ReturnType<typeof getEntries>>[number];
type Daily = Awaited<ReturnType<typeof getDaily>>;

function fmt(t: string | null) {
  if (!t) return "-";
  const d = new Date(t);
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}時間${m}分`;
}

export default function TimeEntrySearchPage() {
  const [userId, setUserId] = useState(1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10)); // YYYY-MM-DD
  const [entries, setEntries] = useState<Entry[]>([]);
  const [daily, setDaily] = useState<Daily | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
      try {
        setLoading(true);
        setErr(null);
        const [e, d] = await Promise.all([getEntries(userId, date), getDaily(userId, date)]);
        setEntries(e);
        setDaily(d);
      } catch (e:any) {
        setErr(e.message ?? "fetch failed");
      } finally {
        setLoading(false);
      }
  }

  return (
    <div style={{maxWidth:900,margin:"2rem auto",padding:16}}>
      <h1>勤怠検索（管理者）</h1>

      <section style={{display:"flex",gap:12,alignItems:"end"}}>
        <div>
          <label>ユーザーID</label><br/>
          <input type="number" value={userId} onChange={e=>setUserId(Number(e.target.value))} />
        </div>
        <div>
          <label>日付</label><br/>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <button onClick={search} disabled={loading}>検索</button>
      </section>

      {err && <p style={{color:"tomato"}}>{err}</p>}

      <section style={{marginTop:16,padding:12,border:"1px solid #ddd",borderRadius:8}}>
        <h3>日次サマリ</h3>
        {daily ? (
          <ul>
            <li>status: <b>{daily.status}</b></li>
            <li>start: {fmt(daily.actual.start)}</li>
            <li>end: {fmt(daily.actual.end)}</li>
            <li>work: {daily.totals.work} 分 / break: {daily.totals.break} 分</li>
          </ul>
        ) : <p>データがありません</p>}
      </section>

      <section style={{marginTop:16}}>
        <h3>打刻一覧</h3>
        <table width="100%" cellPadding={6} style={{borderCollapse:"collapse"}}>
          <thead>
            <tr><th align="left">ID</th><th align="left">種別</th><th align="left">時刻</th><th align="left">source</th></tr>
          </thead>
          <tbody>
            {entries.map(e=>(
              <tr key={e.id} style={{borderTop:"1px solid #eee"}}>
                <td>{e.id}</td>
                <td>{e.kind}</td>
                <td>{fmt(e.happened_at)}</td>
                <td>{e.source}</td>
              </tr>
            ))}
            {entries.length===0 && <tr><td colSpan={4}>データなし</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
