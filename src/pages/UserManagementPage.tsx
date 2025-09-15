import { useEffect, useState } from "react";
import { getPendingUsers, approveUser } from "../lib/api";
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell,
  TableBody, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Stack
} from "@mui/material";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- ダイアログ用のState ---
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [wage, setWage] = useState<number>(1100);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const pendingUsers = await getPendingUsers();
      setUsers(pendingUsers);
    } catch (e: any) {
      setError(e.message ?? "ユーザー情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setRole('employee');
    setWage(1004); // デフォルト時給
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const res = await approveUser(selectedUser.id, role, wage);
      setSuccess(res.message);
      handleCloseDialog();
      await fetchUsers(); // 一覧を再取得
    } catch (e: any) {
      setError(e.message ?? "承認処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}
      <Card elevation={6}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>承認待ちのユーザー</Typography>
          {loading ? <CircularProgress /> : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>名前</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>申請日時</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString('ja-JP')}</TableCell>
                    <TableCell>
                      <Button variant="contained" onClick={() => handleOpenDialog(user)}>承認</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">承認待ちのユーザーはいません</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 承認ダイアログ */}
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>ユーザーの承認</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{selectedUser?.name} さんを承認します。</Typography>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">役職</InputLabel>
              <Select
                labelId="role-select-label"
                value={role}
                label="役職"
                onChange={(e: SelectChangeEvent) => setRole(e.target.value as 'employee' | 'admin')}
              >
                <MenuItem value="employee">従業員</MenuItem>
                <MenuItem value="admin">管理者</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="時給（円）"
              type="number"
              value={wage}
              onChange={(e) => setWage(Number(e.target.value))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleApprove} variant="contained">承認する</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
