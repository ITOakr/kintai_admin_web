import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { me } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import AdminHomePage from "./pages/AdminHomePage";
import TimeEntrySearchPage from "./pages/TimeEntrySearchPage";
import MonthlyPage from "./pages/MonthlyPage";
import UserManagementPage from "./pages/UserManagementPage";

import {
  AppBar, Toolbar, Typography, Container, Button, Stack, Card, CardContent, CardActions, Box,
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider
} from "@mui/material";
import {
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  GroupAdd as GroupAddIcon
} from "@mui/icons-material";
import SavingsIcon from '@mui/icons-material/Savings';

type Role = "employee" | "admin" | null;

// サイドバーコンポーネントを分離
function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#f5f5ff',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              component={Link} 
              to="/" 
              sx={{ 
                color: 'primary.main',
                backgroundColor: location.pathname === '/' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === '/' ? 'bold' : 'normal'
                }
              }}
            >
              <ListItemIcon>
                <SavingsIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="人件費計算" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              component={Link} 
              to="/search" 
              sx={{ 
                color: 'primary.main',
                backgroundColor: location.pathname === '/search' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === '/search' ? 'bold' : 'normal'
                }
              }}
            >
              <ListItemIcon>
                <SearchIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="勤怠検索" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              component={Link} 
              to="/monthly" 
              sx={{ 
                color: 'primary.main',
                backgroundColor: location.pathname === '/monthly' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === '/monthly' ? 'bold' : 'normal'
                }
              }}
            >
              <ListItemIcon>
                <AssessmentIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="月次レポート" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              component={Link} 
              to="/users" 
              sx={{
                color: 'primary.main',
                backgroundColor: location.pathname === '/users' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === '/users' ? 'bold' : 'normal'
                }
              }}
            >
              <ListItemIcon>
                <GroupAddIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="従業員管理" />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List sx={{ marginTop: 'auto' }}>
          <ListItem disablePadding>
            <ListItemButton onClick={onLogout} sx={{ color: 'primary.main' }}>
              <ListItemIcon>
                <LogoutIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="ログアウト" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}

function HeaderContent() {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return { text: '人件費計算', icon: <SavingsIcon /> };
      case '/search':
        return { text: '勤怠検索', icon: <SearchIcon /> };
      case '/monthly':
        return { text: '月次レポート', icon: <AssessmentIcon /> };
      case '/users':
        return { text: '従業員管理', icon: <GroupAddIcon /> };
      default:
        return { text: '人件費計算', icon: <SavingsIcon /> };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {pageInfo.icon}
      <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
        {pageInfo.text}
      </Typography>
    </Box>
  );
}

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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: '#f1f3f5' // より暗めのグレー
      }}>
        {/* ログイン済み管理者向けのヘッダーとサイドバー */}
        {token && role === "admin" && (
          <>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
              <Toolbar sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center', 
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: {xs: 'auto', sm: '200px'}, 
                  }}
                > {/* 左側の余白確保 */}
                  <img 
                    src="/FLan_logo.png" 
                    alt="Logo" 
                    style={{ 
                      height: 50, 
                      objectFit: 'contain'
                    }}
                  />
                </Box>
                <Box sx={{ 
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: { xs: 'none', sm: 'flex' }, // 小画面では非表示
                  alignItems: 'center'
                }}>
                  <HeaderContent />
                </Box>
                <Box sx={{ 
                  minWidth: { xs: 'auto', sm: '200px' },
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}> {/* 右側の余白確保 */}
                </Box>
              </Toolbar>
            </AppBar>
            <Sidebar onLogout={logout} />
          </>
        )}

        <Box component="main" sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          marginLeft: token && role === "admin" ? '240px' : 0,
          marginTop: token && role === "admin" ? '64px' : 0,
          backgroundColor: '#f1f3f5', // 暗めのグレー
          minHeight: '100vh'
        }}>
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
              <Route path="/" element={ <AdminHomePage /> } />
              <Route path="/search" element={<Container maxWidth="xl" sx={{ py: 3 }}><TimeEntrySearchPage /></Container>} />
              <Route path="/monthly" element={<MonthlyPage />} />
              <Route path="/users" element={<UserManagementPage />} />
            </Route>

            {/* 未ログイン時は/loginへ、ログイン済みで見つからないページは/へ */}
            <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}