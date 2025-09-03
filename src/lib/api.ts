const BASE = import.meta.env.VITE_API_BASE_URL as string;

export async function getEntries(userId: number, date: string) {
  const u = new URL(`${BASE}/v1/timeclock/time_entries`);
  u.searchParams.set("user_id", String(userId));
  u.searchParams.set("date", date);
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`GET /time_entries ${r.status}`);
  return r.json() as Promise<Array<{
    id:number; user_id:number; kind:string; happened_at:string; source:string;
  }>>;
}

export async function getDaily(userId: number, date: string) {
  const u = new URL(`${BASE}/v1/attendance/my/daily`);
  u.searchParams.set("user_id", String(userId));
  u.searchParams.set("date", date);
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`GET /my/daily ${r.status}`);
  return r.json() as Promise<{
    date:string; actual:{start:string|null,end:string|null};
    totals:{work:number,break:number,overtime:number,night:number,holiday:number};
    status:"open"|"closed"|"not_started"|"inconsistent_data";
  }>;
}