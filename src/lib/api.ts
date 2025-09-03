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