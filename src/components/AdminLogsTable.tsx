import { useEffect, useState } from "react";
import { getAdminLogs, AdminLog } from "../lib/api";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, Alert, TablePagination, Box } from "@mui/material";

// 日時を見やすい形式にフォーマットする関数
function formatDateTime(isoString: string) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("ja-JP", {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

export default function AdminLogsTable() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ページネーションの状態
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAdminLogs(page + 1, rowsPerPage); // APIは1始まり
        setLogs(res.logs);
        setTotalCount(res.total_count); // 総件数を設定
      } catch (err) {
        setError("ログの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, rowsPerPage]); // pageかrowsPerPageが変わるたびに再取得

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (logs.length === 0) return <Typography>ログがありません</Typography>;

  return (
    <Paper>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>日時</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>操作者</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>操作内容</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>詳細</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {formatDateTime(log.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {log.admin_user_name}
                </TableCell>
                <TableCell>
                  {log.action}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'pre-wrap' }}>
                  {log.details || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
}