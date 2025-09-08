// すでにログイン・adminチェックを通過している前提のメイン領域を差し替え
import { useEffect, useMemo, useState } from "react";
import { getDailyTotal, getSales, putSales, getLRatio } from "../lib/api.ts";

function fmtYen(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString("ja-JP") + " 円";
}
function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}時間${m}分`;
}

export default function AdminHomePage() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 人件費一覧
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof getDailyTotal>>["rows"]
  >([]);
  const [totalWage, setTotalWage] = useState<number>(0);

  // 売上
  const [sales, setSales] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");

  // 比率
  const [ratio, setRatio] = useState<number | null>(null);

  async function refreshAll(d = date) {
    try {
      setLoading(true);
      setErr(null);
      const [t, s, r] = await Promise.all([
        getDailyTotal(d),
        getSales(d),
        getLRatio(d),
      ]);
      setRows(t.rows);
      setTotalWage(t.total_daily_wage);

      setSales(s.amount_yen);
      setNote(s.note ?? "");

      setRatio(r.l_ratio);
    } catch (e: any) {
      setErr(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function saveSales() {
    try {
      setLoading(true);
      setErr(null);
      await putSales(date, Number(sales ?? 0), note || undefined);
      // 保存後、最新の比率を再計算して反映
      const r = await getLRatio(date);
      setRatio(r.l_ratio);
    } catch (e: any) {
      setErr(e?.message ?? "save failed");
    } finally {
      setLoading(false);
    }
  }

  const monthLabel = useMemo(() => {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [date]);

  return (
    <div style={{ maxWidth: 1100, margin: "2rem auto", padding: 16, display: "grid", gap: 16, gridTemplateColumns: "1fr 320px" }}>
      <div>
        <header style={{ display: "flex", gap: 12, alignItems: "end" }}>
          <div>
            <label>日付</label><br />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button onClick={() => refreshAll()} disabled={loading}>
            {loading ? "更新中…" : "再計算"}
          </button>
          <div style={{ marginLeft: "auto", opacity: 0.7 }}>{monthLabel}</div>
        </header>

        {err && <p style={{ color: "tomato", marginTop: 8 }}>{err}</p>}

        <section style={{ marginTop: 12 }}>
          <h3>人件費一覧</h3>
          <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse", border: "1px solid #eee" }}>
            <thead>
              <tr>
                <th align="left">ユーザー</th>
                <th align="right">実働</th>
                <th align="right">休憩</th>
                <th align="right">深夜</th>
                <th align="right">基本時給</th>
                <th align="right">日額人件費</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td>{r.user_name} (ID:{r.user_id})</td>
                  <td align="right">{minutesToHM(r.work_minutes)}</td>
                  <td align="right">{minutesToHM(r.break_minutes)}</td>
                  <td align="right">{minutesToHM(r.night_minutes)}</td>
                  <td align="right">{fmtYen(r.base_hourly_wage)}</td>
                  <td align="right"><b>{fmtYen(r.daily_wage)}</b></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 16, color: "#666" }}>
                    当日の勤務データがありません
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #ddd"}}>
                <td colSpan={5} align="right">合計</td>
                <td align="right"><b>{fmtYen(totalWage)}</b></td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>

      <aside style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
        <h3>売上入力</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <label>金額（円）</label>
          <input
            type="number"
            value={sales ?? ""}
            onChange={(e) => setSales(e.target.value === "" ? null : Number(e.target.value))}
          />
          <label>メモ（任意）</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
          <button onClick={saveSales} disabled={loading}>{loading ? "保存中…" : "保存"}</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h4>売上対人件費（即時計算）</h4>
          <p>売上：<b>{fmtYen(sales)}</b></p>
          <p>人件費合計：<b>{fmtYen(totalWage)}</b></p>
          <p>比率：<b>{ratio == null ? "-" : `${(ratio * 100).toFixed(2)} %`}</b></p>
        </div>
      </aside>
    </div>
  );
}