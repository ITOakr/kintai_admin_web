// src/pages/LoginPage.tsx
import { useState } from "react";
import { login } from "../lib/api";
import {
  Box, Card, CardContent, CardActions,
  TextField, Button, Typography,
  Stack
} from "@mui/material";

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
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: 'primary.main' }}>
      <Stack spacing={4} alignItems="center">
        <img src="/FLan_logo.png" alt="logo" style={{ width: '250px' }} />
        <Card sx={{ width: 380, maxWidth: "90vw", mt: 4 }} component="form" onSubmit={doLogin}>
          <CardContent>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              管理者ログイン
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="メール"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                fullWidth
              />
              <TextField
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                fullWidth
              />
            </Stack>
            {authErr && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {authErr}
              </Typography>
            )}
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2, mt: 1 }}>
            <Button type="submit" variant="contained" disabled={loginBusy} fullWidth>
              {loginBusy ? "ログイン中…" : "ログイン"}
            </Button>
          </CardActions>
        </Card>
      </Stack>
    </Box>
  );
}
