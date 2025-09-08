import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet } from "react-router-dom";
import { me } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import AdminHomePage from "./pages/AdminHomePage";
import TimeEntrySearchPage from "./pages/TimeEntrySearchPage";

type Role = "employee" | "admin" | null;

function AdminRoute({ role }: { role: Role }) {
  if (role !== "admin") {
    return <Navigate to="/auth-error" replace />;
  }
  return <Outlet />;
}

// 権限エラーページを独立したコンポーネントとして定義
function AuthErrorPage({ onLogout }: { onLogout: () => void }) {
  return (
    <div style={{ maxWidth: 600, margin: "6rem auto", padding: 16 }}>
      <h1>権限がありません</h1>
      <p>管理者のみがこの画面にアクセスできます。</p>
      <button onClick={onLogout} style={{ marginTop: 12 }}> 
        ログアウト
      </button>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [role, setRole] = useState<Role>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [authErr, setAuthErr] = useState<string | null>(null);

  // /auth/me でrole取得
  useEffect(() => {
      if (!token) {
        setRole(null);
        setLoadingRole(false);
        return;
      }

      setLoadingRole(true);
      
      me().then(user => {
        setRole(user.role ?? null);
      }).catch(e => {
        setAuthErr(e.message ?? "トークンが無効です。再度ログインしてください。");
        localStorage.removeItem("token");
        setToken(null);
      }).finally(() => {
        setLoadingRole(false);
    });
  }, [token]);

  function handleLoginSuccess(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAuthErr(null);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setRole(null);
  }

  if (loadingRole) {
    return <div style={{padding:24}}><h2>権限を確認中...</h2></div>
  }

  // 未ログイン：ログインカードを表示
  return (
    <BrowserRouter>
      {/* ログイン済み管理者向けのヘッダー */}
      {token && role === "admin" && (
        <header style={{ background: "#333", color: "white", padding: "8px 16px", display: "flex", alignItems: "center" }}>
          <nav>
            <Link to="/" style={{ color: "white", marginRight: 16 }}>ホーム</Link>
            <Link to="/search" style={{ color: "white" }}>勤怠検索</Link>
          </nav>
          <button onClick={logout} style={{ marginLeft: "auto" }}>ログアウト</button>
        </header>
      )}

      <main>
        <Routes>
          {/* ログインページ: /login */}
          <Route path="/login" element={
            token ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} initialError={authErr} />
          } />
          <Route path="/auth-error" element={
            token ? <AuthErrorPage onLogout={logout} /> : <Navigate to="/login" replace />
          } />
          {/* 管理者向けページ */}
          <Route element={<AdminRoute role={role} />}>
            <Route path="/" element={<AdminHomePage />} />
            <Route path="/search" element={<TimeEntrySearchPage />} />
          </Route>

          {/* 未ログイン時は/loginへ、ログイン済みで見つからないページは/へ */}
          <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}