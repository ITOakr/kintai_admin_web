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

export async function getPendingUsers() {
  const r = await fetch(`${BASE}/users/pending`, { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /users/pending ${r.status}`);
  return r.json() as Promise<Array<{ 
    id:number;
    email:string;
    name:string;
    created_at:string;
  }>>;
}

export async function approveUser(userId: number, role: "employee" | "admin", base_hourly_wage: number) {
  const u = new URL(`${BASE}/users/${userId}/approve`);
  const body = new URLSearchParams({ role: role, base_hourly_wage: String(base_hourly_wage) });
  const r = await fetch(u.toString(), {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
  if (!r.ok) {
    const resBody = await r.json();
    throw new Error(resBody?.errors?.join(", ") ?? `POST /users/${userId}/approve ${r.status}`);
  }
  return r.json() as Promise<{ message: string }>;
}

export async function me() {
  const r = await fetch(`${BASE}/auth/me`, { headers: authHeader() });
  if (!r.ok) throw new Error(`me ${r.status}`);
  return r.json() as Promise<{ id:number; email:string; name:string; role?: "employee"|"admin" }>;
}

export async function getUsers() {
  const r = await fetch(`${BASE}/users`, { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /users ${r.status}`);
  return r.json() as Promise<Array<{ 
    id:number;
    email:string;
    name:string;
    role:"employee"|"admin";
    base_hourly_wage:number;
    created_at:string;
  }>>;
}

export async function updateUser(userId: number, role: "employee" | "admin", base_hourly_wage: number) {
  const u = new URL(`${BASE}/users/${userId}`);
  const body = new URLSearchParams({ role: role, base_hourly_wage: String(base_hourly_wage) });
  const r = await fetch(u.toString(), {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
  if (!r.ok) {
    const resBody = await r.json();
    throw new Error(resBody?.errors?.join(", ") ?? `PATCH /users/${userId} ${r.status}`);
  }
  return r.json() as Promise<{ message: string }>;
}

export async function deleteUser(userId: number) {
  const u = new URL(`${BASE}/users/${userId}`);
  const r = await fetch(u.toString(), {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!r.ok) {
    const resBody = await r.json();
    throw new Error(resBody?.errors?.join(", ") ?? `DELETE /users/${userId} ${r.status}`);
  }
  return r.json() as Promise<{ message: string }>;
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

// 食材費の取得/保存（管理者）
export async function getFoodCosts(date: string) {
  const u = new URL(`${BASE}/v1/food_costs`);
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /v1/food_costs ${r.status}`);
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

export async function putFoodCosts(date: string, amount_yen: number, note?: string) {
  const u = new URL(`${BASE}/v1/food_costs`);
  u.searchParams.set("date", date);
  const body = new URLSearchParams({ amount_yen: String(amount_yen) });
  if (note) body.set("note", note);
  const r = await fetch(u.toString(), {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
  if (!r.ok) throw new Error(`PUT /v1/food_costs ${r.status}`);
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

// 月次 LRatio
export async function getMonthlyLRatio(year: number, month: number) {
  const BASE = import.meta.env.VITE_API_BASE_URL as string;
  const t = localStorage.getItem("token");
  const headers: Record<string, string> = t ? { Authorization: `Bearer ${t}` } : {};

  const u = new URL(`${BASE}/v1/l_ratio/monthly`);
  u.searchParams.set("year", String(year));
  u.searchParams.set("month", String(month));

  const r = await fetch(u.toString(), { headers });
  if (!r.ok) throw new Error(`GET /v1/l_ratio/monthly ${r.status}`);
  return r.json() as Promise<{
    year: number;
    month: number;
    days: Array<{
      date: string;
      daily_sales: number | null;
      total_daily_wage: number;
      l_ratio: number | null;
    }>;
    monthly_sales: number | null;
    monthly_wage: number;
    monthly_l_ratio: number | null;
  }>;
}

// FRatio（管理者）
export async function getFRatio(date: string) {
  const u = new URL(`${BASE}/v1/f_ratio/daily`);
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /v1/f_ratio/daily ${r.status}`);
  return r.json() as Promise<{ date: string; daily_sales: number | null; daily_food_cost: number; f_ratio: number | null }>;
}

// 月次 FRatio
export async function getMonthlyFRatio(year: number, month: number) {
  const BASE = import.meta.env.VITE_API_BASE_URL as string;
  const t = localStorage.getItem("token");
  const headers: Record<string, string> = t ? { Authorization: `Bearer ${t}` } : {};

  const u = new URL(`${BASE}/v1/f_ratio/monthly`);
  u.searchParams.set("year", String(year));
  u.searchParams.set("month", String(month));

  const r = await fetch(u.toString(), { headers });
  if (!r.ok) throw new Error(`GET /v1/f_ratio/monthly ${r.status}`);
  return r.json() as Promise<{
    year: number;
    month: number;
    days: Array<{
      date: string;
      daily_sales: number | null;
      daily_food_cost: number;
      f_ratio: number | null;
    }>;
    monthly_sales: number | null;
    monthly_food_cost: number;
    monthly_f_ratio: number | null;
  }>;
}

// FLRatio（管理者）
export async function getFLRatio(date: string) {
  const u = new URL(`${BASE}/v1/f_l_ratio/daily`);
  u.searchParams.set("date", date);
  const r = await fetch(u.toString(), { headers: authHeader() });
  if (!r.ok) throw new Error(`GET /v1/f_l_ratio/daily ${r.status}`);
  return r.json() as Promise<{ date: string; daily_sale: number | null; daily_food_cost: number; total_daily_wage:number | null; f_l_ratio: number | null }>;
}

// 月次 FRatio
export async function getMonthlyFLRatio(year: number, month: number) {
  const BASE = import.meta.env.VITE_API_BASE_URL as string;
  const t = localStorage.getItem("token");
  const headers: Record<string, string> = t ? { Authorization: `Bearer ${t}` } : {};

  const u = new URL(`${BASE}/v1/f_l_ratio/monthly`);
  u.searchParams.set("year", String(year));
  u.searchParams.set("month", String(month));

  const r = await fetch(u.toString(), { headers });
  if (!r.ok) throw new Error(`GET /v1/f_l_ratio/monthly ${r.status}`);
  return r.json() as Promise<{
    year: number;
    month: number;
    days: Array<{
      date: string;
      daily_sale: number | null;
      daily_food_cost: number;
      f_l_ratio: number | null;
    }>;
    monthly_sale: number | null;
    monthly_food_cost: number;
    monthly_f_l_ratio: number | null;
  }>;
}
