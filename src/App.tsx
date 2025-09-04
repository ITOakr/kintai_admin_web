import { useEffect, useState } from "react";
import { getEntries, getDaily, login, me } from "./lib/api";

type Entry = Awaited<ReturnType<typeof getEntries>>[number];
type Daily = Awaited<ReturnType<typeof getDaily>>;

type Role = "employee" | "admin" | null;

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

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [role, setRole] = useState<Role>(null);
  const [authErr, setAuthErr] = useState<string | null>(null);
  const loggedIn = !!token;

  const [userId, setUserId] = useState(1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10)); // YYYY-MM-DD
  const [entries, setEntries] = useState<Entry[]>([]);
  const [daily, setDaily] = useState<Daily | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("pass1234");
  const [loginBusy, setLoginBusy] = useState(false);

  // ログイン処理
  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoginBusy(true);
      setAuthErr(null);
      const res = await login(email, password);
      localStorage.setItem("token", res.token);
      setToken(res.token);
    } catch (e: any) {
      setAuthErr(e?.message ?? "ログインに失敗しました");
    } finally {
      setLoginBusy(false);
    }
  }

  // /auth/me でrole取得
  useEffect(() => {
    (async () => {
      if (!loggedIn) {
        setRole(null);
        return;
      }
      try {
        setAuthErr(null);
        const u = await me(); // { id, email, name, role? }
        // role が返ってこない古いAPIでも動くように既定値 employee
        const r = (u as any).role as Role | undefined;
        setRole(r ?? "employee");
      } catch (e: any) {
        setAuthErr("トークンが無効です。再ログインしてください。");
        // 無効トークンなら破棄
        localStorage.removeItem("token");
        setToken(null);
      }
    })();
  }, [loggedIn]);

  async function search() {
    try {
      setLoading(true); setErr(null);
      const [e, d] = await Promise.all([getEntries(userId, date), getDaily(userId, date)]);
      setEntries(e); setDaily(d);
    } catch (e:any) {
      setErr(e.message ?? "fetch failed");
    } finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setRole(null);
    setEntries([]);
    setDaily(null);
  }

  // 未ログイン：ログインカードを表示
  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 420, margin: "6rem auto", padding: 16 }}>
        <h1>勤怠（管理者）ログイン</h1>
        <form onSubmit={doLogin} style={{ marginTop: 16 }}>
          <div>
            <label>メール</label>
            <br />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <label>パスワード</label>
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ width: "100%" }}
            />
          </div>
          <button type="submit" disabled={loginBusy} style={{ marginTop: 12 }}>
            {loginBusy ? "ログイン中…" : "ログイン"}
          </button>
        </form>
        {authErr && <p style={{ color: "tomato", marginTop: 8 }}>{authErr}</p>}
        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          デモ：demo@example.com / pass1234
        </p>
      </div>
    );
  }

  // ログイン済みだが admin 以外：閲覧禁止
  if (role !== "admin") {
    return (
      <div style={{ maxWidth: 600, margin: "6rem auto", padding: 16 }}>
        <h1>権限がありません</h1>
        <p>管理者のみがこの画面にアクセスできます。</p>
        <button onClick={logout} style={{ marginTop: 12 }}>
          ログアウト
        </button>
        {authErr && <p style={{ color: "tomato", marginTop: 8 }}>{authErr}</p>}
      </div>
    );
  }

  return (
    <div style={{maxWidth:900,margin:"2rem auto",padding:16}}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>勤怠（管理者）</h1>
        <button onClick={logout}>ログアウト</button>
      </header>

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
        ) : <p>未取得</p>}
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