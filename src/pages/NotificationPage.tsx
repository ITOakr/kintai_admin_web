// src/pages/NotificationPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead, Notification as NotificationType } from '../lib/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

type Props = {
  onNotificationRead: () => void;
};

// 時間を見やすい形式にフォーマットする関数
function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationPage({ onNotificationRead }: Props) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = await getNotifications();
      setNotifications(allNotifications);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
        setError((err as { message: string }).message);
      } else {
        setError('お知らせの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        onNotificationRead(); // 親コンポーネントに通知が読まれたことを伝える
        setNotifications(notifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (err) {
        console.error(err);
        setError('お知らせの更新に失敗しました');
        return;
      }
    }
    navigate(notification.link_to);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card elevation={6}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            お知らせ一覧
          </Typography>
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {/* ▼▼▼ 列の順番を変更 ▼▼▼ */}
                  <TableCell sx={{ width: '20%', fontWeight: 'bold' }}>受信日時</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>メッセージ</TableCell>
                  {/* ▲▲▲ 列の順番を変更 ▲▲▲ */}
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    hover
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: notification.read ? '#fafafa' : '#fff',
                      color: notification.read ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {/* ▼▼▼ 列の順番を変更し、「状態」列を削除 ▼▼▼ */}
                    <TableCell>{formatDateTime(notification.created_at)}</TableCell>
                    <TableCell sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                      {notification.message}
                    </TableCell>
                    {/* ▲▲▲ 列の順番を変更し、「状態」列を削除 ▲▲▲ */}
                  </TableRow>
                ))}
                {notifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      <Typography color="text.secondary" sx={{ p: 4 }}>
                        お知らせはありません。
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}