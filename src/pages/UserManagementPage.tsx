import { useEffect, useState, useCallback } from "react";
import { getPendingUsers, approveUser, getUsers, updateUser, deleteUser } from "../lib/api";
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell,
  TableBody, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Stack, Tab, Tabs, IconButton, Divider
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';

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
  const [dialogMode, setDialogMode] = useState<'approve' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [wage, setWage] = useState<number>(1100);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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

  const handleOpenDialog = (user: User, mode: 'approve' | 'edit') => {
    setSelectedUser(user);
    setDialogMode(mode);
    setRole(user.role ?? 'employee');
    setWage(user.base_hourly_wage || 1004); // デフォルト時給
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
    setSelectedUser(null);
  };

  const handleOpenDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  };
  
  const handleCloseDeleteConfirm = () => {
    setSelectedUser(null);
    setDeleteConfirmOpen(false);
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      let res;
      if (dialogMode === 'approve') {
        res = await approveUser(selectedUser.id, role, wage);
      } else if (dialogMode === 'edit') {
        res = await updateUser(selectedUser.id, role, wage);
      }
      setSuccess(res?.message || "処理が完了しました");
      handleCloseDialog();
      await fetchAllUsers(); // 一覧を再取得
    } catch (e: any) {
      setError(e.message ?? "処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await deleteUser(selectedUser.id);
      setSuccess(res?.message || "削除しました");
      handleCloseDeleteConfirm();
      await fetchAllUsers(); // 一覧を再取得
    } catch (e: any) {
      setError(e.message ?? "削除に失敗しました");
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
              <Tab label="従業員一覧" id="simple-tab-0" sx={{ '&:focus': { outline: 'none' } }} />
              <Tab label="承認待ちユーザー" id="simple-tab-1" sx={{ '&:focus': { outline: 'none' } }} />
            </Tabs>
          </Box>
          <CustomTabPanel value={tabIndex} index={0}>
            {/* 従業員一覧 */}
            {loading ? <CircularProgress /> : (
              <Table>
                <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 'bold' } }}>
                  <TableRow>
                    <TableCell>名前</TableCell>
                    <TableCell>メールアドレス</TableCell>
                    <TableCell>役職</TableCell>
                    <TableCell>時給</TableCell>
                    <TableCell>編集 / 削除</TableCell>
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
                        <IconButton
                          onClick={() => handleOpenDialog(user, 'edit')}
                          sx={{ '&:focus': { outline: 'none' } }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleOpenDeleteConfirm(user)}
                          sx={{ '&:focus': { outline: 'none' } }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">従業員データがありません</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CustomTabPanel>

          <CustomTabPanel value={tabIndex} index={1}>
            {loading ? <CircularProgress /> : (
              <Table>
                <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 'bold' } }}>
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
                        <Button variant="contained" onClick={() => handleOpenDialog(user, 'approve')}>承認</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">承認待ちのユーザーはいません</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CustomTabPanel>
        </CardContent>
      </Card>

      {/* 承認 / 編集 ダイアログ */}
      <Dialog open={!!dialogMode} onClose={handleCloseDialog}>
        <DialogTitle>{dialogMode === 'approve' ? '従業員の承認' : '従業員の編集'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{selectedUser?.name} さんを{dialogMode === 'approve' ? '承認' : '編集'}します。</Typography>
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
          <Button onClick={handleCloseDialog} sx={{ '&:focus': { outline: 'none' } }}>キャンセル</Button>
          <Button onClick={handleConfirm} variant="contained" disabled={loading} sx={{ '&:focus': { outline: 'none' } }}>
            {loading ? <CircularProgress size={24} /> : (dialogMode === 'approve' ? '承認' : '保存')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>従業員の削除</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {selectedUser?.name} さんを削除します。よろしいですか？
          </Typography>
          <Divider />
          <Typography color="error" sx={{ mt: 2 }}>
            ※ 削除したユーザーは復元できません。<br/>
            ※ 関連する勤怠データは削除されません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} sx={{ '&:focus': { outline: 'none' } }}>キャンセル</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={loading} sx={{ '&:focus': { outline: 'none' } }}>
            {loading ? <CircularProgress size={24} /> : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
