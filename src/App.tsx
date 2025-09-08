import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet } from "react-router-dom";
import { me } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import AdminHomePage from "./pages/AdminHomePage";
import TimeEntrySearchPage from "./pages/TimeEntrySearchPage";
import MonthlyPage from "./pages/MonthlyPage";

import {
  AppBar, Toolbar, Typography, Container, Button, Stack, Card, CardContent, CardActions
} from "@mui/material";

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
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>権限がありません</Typography>
          <Typography color="text.secondary">
            管理者のみがこの画面にアクセスできます。
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onLogout}>ログアウト</Button>
        </CardActions>
      </Card>
    </Container>
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
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h6">権限を確認中...</Typography>
      </Container>
    );
  }

  // 未ログイン：ログインカードを表示
  return (
    <BrowserRouter>
      {/* ログイン済み管理者向けのヘッダー */}
      {token && role === "admin" && (
        <AppBar position ="sticky">
          <Toolbar sx ={{ display: "flex", gap: 2 }}>
            <Typography variant="h6" sx={{ mr: 2 }}>
              勤怠管理（管理者）
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button color="inherit" component={Link} to="/">ホーム</Button>
              <Button color="inherit" component={Link} to="/search">勤怠検索</Button>
              <Button color="inherit" component={Link} to="/monthly">月次レポート</Button>
            </Stack>
            <Stack direction="row" sx={{ marginLeft: "auto" }}>
              <Button color="inherit" onClick={logout}>ログアウト</Button>
            </Stack>
          </Toolbar>
        </AppBar>
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
            <Route path="/" element={<Container maxWidth="lg" sx={{ py: 3 }}><AdminHomePage /></Container>} />
            <Route path="/search" element={<Container maxWidth="lg" sx={{ py: 3 }}><TimeEntrySearchPage /></Container>} />
            <Route path="/monthly" element={<Container maxWidth="lg" sx={{ py: 3 }}>< MonthlyPage /></Container>} />
          </Route>

          {/* 未ログイン時は/loginへ、ログイン済みで見つからないページは/へ */}
          <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}