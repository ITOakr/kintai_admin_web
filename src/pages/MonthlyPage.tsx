import { useEffect, useMemo, useState } from "react";
import { getMonthlyLRatio } from "../lib/api";

function fmtYen(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString("ja-JP") + " 円";
}
function fmtPct(x: number | null | undefined) {
  if (x == null) return "-";
  return (x * 100).toFixed(2) + " %";
}

export default function MonthlyPage() {
  // input[type=month] は "YYYY-MM" 形式
  const [ym, setYm] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<
    Array<{ date: string; daily_sales: number | null; total_daily_wage: number; l_ratio: number | null }>
  >([]);
  const [monthSales, setMonthSales] = useState<number | null>(null);
  const [monthWage, setMonthWage] = useState(0);
  const [monthRatio, setMonthRatio] = useState<number | null>(null);

  const { year, month } = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    return { year: y, month: m };
  }, [ym]);

  async function fetchMonthly() {
    try {
      setLoading(true);
      setErr(null);
      const res = await getMonthlyLRatio(year, month);
      setRows(res.days);
      setMonthSales(res.monthly_sales);
      setMonthWage(res.monthly_wage);
      setMonthRatio(res.monthly_l_ratio);
    } catch (e: any) {
      setErr(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonthly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "2rem auto", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "end" }}>
        <div>
          <label>対象月</label><br />
          <input type="month" value={ym} onChange={(e) => setYm(e.target.value)} />
        </div>
        <button onClick={fetchMonthly} disabled={loading}>{loading ? "取得中…" : "再取得"}</button>
        <div style={{ marginLeft: "auto", opacity: 0.7 }}>
          {year}年{month}月
        </div>
      </header>

      {err && <p style={{ color: "tomato", marginTop: 8 }}>{err}</p>}

      <section style={{ marginTop: 16 }}>
        <h3>日別一覧</h3>
        <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse", border: "1px solid #eee" }}>
          <thead>
            <tr>
              <th align="left">日付</th>
              <th align="right">売上</th>
              <th align="right">人件費</th>
              <th align="right">人件費比率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.date} style={{ borderTop: "1px solid #f0f0f0" }}>
                <td>{d.date}</td>
                <td align="right">{fmtYen(d.daily_sales)}</td>
                <td align="right">{fmtYen(d.total_daily_wage)}</td>
                <td align="right">{fmtPct(d.l_ratio)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 16, color: "#666" }}>
                  データがありません
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #ddd" }}>
              <td align="right"><b>月合計 / 月間比率</b></td>
              <td align="right"><b>{fmtYen(monthSales)}</b></td>
              <td align="right"><b>{fmtYen(monthWage)}</b></td>
              <td align="right"><b>{fmtPct(monthRatio)}</b></td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}