const BASE = import.meta.env.VITE_API_BASE_URL as string;

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams({ email, password }),
  });
  if (!r.ok) throw new Error(`login ${r.status}`);
  return r.json() as Promise<{ token: string; user: { id: number; name: string; email: string } }>;
}

export async function me() {
  const r = await fetch(`${BASE}/auth/me`, { headers: authHeader() });
  if (!r.ok) throw new Error(`me ${r.status}`);
  return r.json() as Promise<{ id:number; email:string; name:string; role?: "employee"|"admin" }>;
}

export async function getEntries(userId: number, date: string) {
  const u = new URL(`${BASE}/v1/timeclock/time_entries`);
  u.searchParams.set("user_id", String(userId));
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /time_entries ${r.status}`);
  return r.json() as Promise<Array<{
    id:number; user_id:number; kind:string; happened_at:string; source:string;
  }>>;
}

export async function getDaily(userId: number, date: string) {
  const u = new URL(`${BASE}/v1/attendance/my/daily`);
  u.searchParams.set("user_id", String(userId));
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /my/daily ${r.status}`);
  return r.json() as Promise<{
    date:string; actual:{start:string|null,end:string|null};
    totals:{work:number,break:number,overtime:number,night:number,holiday:number};
    status:"open"|"closed"|"not_started"|"inconsistent_data";
  }>;
}

// 日別：人件費の一覧＋合計（管理者）
export async function getDailyTotal(date: string) {
  const u = new URL(`${BASE}/v1/payroll/daily_total`);
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /daily_total ${r.status}`);
  // 期待レスポンス
  // { date, raws: [ { user_id, name, work_minutes, break_minutes, night_minutes, base_hourly_wage, total_wage } ], total_total_wage }
  return r.json() as Promise<{
    date: string;
    rows: Array<{
      user_id:number;
      user_name:string;
      base_hourly_wage:number;
      work_minutes:number;
      break_minutes:number;
      night_minutes:number;
      daily_wage:number;
    }>;
    total_daily_wage: number;
  }>;
}

// 売上　取得/保存（管理者）
export async function getSales(date: string) {
  const u = new URL(`${BASE}/v1/sales`);
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /v1/sales ${r.status}`);
  return r.json() as Promise<{ date: string; amount_yen: number | null; note: string | null }>;
}

export async function putSales(date: string, amount_yen: number, note?: string) {
  const u = new URL(`${BASE}/v1/sales`);
  u.searchParams.set("date", date);
  const body = new URLSearchParams({ amount_yen: String(amount_yen) });
  if (note) body.set("note", note);
  const r = await fetch(u.toString(), {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
  if (!r.ok) throw new Error(`PUT /v1/sales ${r.status}`);
  return r.json() as Promise<{ id: number; date: string; amount_yen: number; note?: string | null }>;
}

// LRatio（管理者）
export async function getLRatio(date: string) {
  const u = new URL(`${BASE}/v1/l_ratio/daily`);
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /v1/l_ratio/daily ${r.status}`);
  return r.json() as Promise<{ date: string; daily_sales: number | null; total_daily_wage: number; l_ratio: number | null }>;
}
