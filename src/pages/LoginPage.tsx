// src/pages/LoginPage.tsx

import { useState } from "react";
import { login } from "../lib/api";

type Props = {
  onLoginSuccess: (token: string) => void;
  initialError: string | null;
};

export default function LoginPage({ onLoginSuccess, initialError }: Props) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("adminpass");
  const [loginBusy, setLoginBusy] = useState(false);
  const [authErr, setAuthErr] = useState<string | null>(initialError);

  // ログイン処理
  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoginBusy(true);
      setAuthErr(null);
      const res = await login(email, password);
      onLoginSuccess(res.token);
    } catch (e: any) {
      setAuthErr(e?.message ?? "ログインに失敗しました");
    } finally {
      setLoginBusy(false);
    }
  }

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
    </div>
  );
}