import { useEffect, useState, useCallback } from "react";
import { getPendingUsers, approveUser, getUsers } from "../lib/api";
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell,
  TableBody, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Stack, Tab, Tabs
} from "@mui/material";
interface User {
  id: number;
  name: string;
  email: string;
  role?: 'employee' | 'admin';
  base_hourly_wage?: number;
  created_at: string;
}

// タブパネルのためのコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  // --- ダイアログ用のState ---
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [wage, setWage] = useState<number>(1100);

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const [pending, active] = await Promise.all([
        getPendingUsers(),
        getUsers()
      ]);
      setPendingUsers(pending);
      setActiveUsers(active);
    } catch (e: any) {
      setError(e.message ?? "ユーザー情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

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
      setSuccess(null);
      const res = await approveUser(selectedUser.id, role, wage);
      setSuccess(res.message);
      handleCloseDialog();
      await fetchAllUsers(); // 一覧を再取得
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
      <Card elevation={6} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="user management tabs">
              <Tab label="承認待ちユーザー" id="simple-tab-0" sx={{ '&:focus': { outline: 'none' } }} />
              <Tab label="従業員一覧" id="simple-tab-1" sx={{ '&:focus': { outline: 'none' } }} />
            </Tabs>
          </Box>

          <CustomTabPanel value={tabIndex} index={0}>
            {loading ? <CircularProgress /> : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>名前</TableCell>
                    <TableCell>メールアドレス</TableCell>
                    <TableCell>申請日時</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleString('ja-JP')}</TableCell>
                      <TableCell>
                        <Button variant="contained" onClick={() => handleOpenDialog(user)}>承認</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">承認待ちのユーザーはいません</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CustomTabPanel>

          <CustomTabPanel value={tabIndex} index={1}>
            {/* 従業員一覧 */}
            {loading ? <CircularProgress /> : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>名前</TableCell>
                    <TableCell>メールアドレス</TableCell>
                    <TableCell>役職</TableCell>
                    <TableCell>時給</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role === 'admin' ? '管理者' : '従業員'}</TableCell>
                      <TableCell>{user.base_hourly_wage?.toLocaleString() ?? 0} 円</TableCell>
                      <TableCell>
                        {/* 将来的に編集機能などを追加する場合はこちらにボタンを配置 */}
                        -
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">従業員データがありません</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CustomTabPanel>
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
