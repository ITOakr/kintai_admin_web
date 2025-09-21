import { 
  Box, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableFooter
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// --- このファイル内でしか使わないヘルパー関数 ---
function fmtYen(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString("ja-JP") + " 円";
}
function fmtPct(x: number | null | undefined) {
  if (x == null) return "-";
  return (x * 100).toFixed(2) + " %";
}
function fmtDateCell({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeekIndex = date.getDay();
  const dayOfWeek = weekDays[dayOfWeekIndex];

  let dayColor = 'inherit';
  if (dayOfWeekIndex === 0){
    dayColor = 'error.main'; // 日曜日は赤
  } else if (dayOfWeekIndex === 6) {
    dayColor = 'primary.main'; // 土曜日は青
  }

  return (
    <>
      {day}日
      <Box component="span" sx={{ color: dayColor }}>
        ({dayOfWeek})
      </Box>
    </>
  );
}

// 1行分のデータの型
interface MonthlyDataRow {
  date: string;
  daily_sales: number | null;
  total_daily_wage: number;
  daily_food_costs: number | null;
  l_ratio: number | null;
  f_ratio: number | null;
  f_l_ratio: number | null;
}

// このコンポーネントが受け取るProps全体の型定義
interface MonthlyReportTableProps {
  rows: MonthlyDataRow[]; // 1行分のデータの配列
  monthSales: number | null;
  monthWage: number;
  monthFoodCosts: number | null;
  monthLRatio: number | null;
  monthFRatio: number | null;
  monthFLRatio: number | null;
}

export default function MonthlyReportTable({
  rows,
  monthSales,
  monthWage,
  monthFoodCosts,
  monthLRatio,
  monthFRatio,
  monthFLRatio
}: MonthlyReportTableProps) {
  const navigate = useNavigate();
  const handleRowClick = (date: string) => {
    navigate(`/?date=${date}`);
  }
  return (
    <TableContainer component={Paper} elevation={0} sx={{ 
      border: '2px solid #e0e0e0', 
      maxHeight: 'calc(100vh - 200px)',
      '&::-webkit-scrollbar': { width: '8px' },
      '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
      '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '4px' },
      '&::-webkit-scrollbar-thumb:hover': { background: '#a8a8a8' }
    }}>
      <Table stickyHeader sx={{
        tableLayout: 'fixed',
        '& th, & td': { 
          border: '1px solid #e0e0e0', 
          padding: '7px 10px' 
        },
        '& th': { 
          backgroundColor: '#f5f5f5', 
          fontWeight: 'bold', 
          fontSize: '1.25rem',
          color: '#424242'
        },
        '& td': { fontSize: '1.25rem' }
      }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '10%' }}>日付</TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>売上</TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>人件費</TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>食材費</TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>人件費比率</TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>食材費比率</TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>FL比率</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow 
              key={row.date} 
              hover 
              onClick={() => handleRowClick(row.date)}
              sx={{ 
                '&:hover': { bgcolor: '#f8f9fa' },
                cursor: 'pointer'
              }}
            >
              <TableCell>
                {fmtDateCell({ dateStr: row.date }) }
              </TableCell>
              <TableCell align="right">{fmtYen(row.daily_sales)}</TableCell>
              <TableCell align="right">{fmtYen(row.total_daily_wage)}</TableCell>
              <TableCell align="right">{fmtYen(row.daily_food_costs)}</TableCell>
              <TableCell align="right">
                <Box sx={{ color: row.l_ratio && row.l_ratio >= 0.3 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                  {fmtPct(row.l_ratio)}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ color: row.f_ratio && row.f_ratio >= 0.3 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                  {fmtPct(row.f_ratio)}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ color: row.f_l_ratio && row.f_l_ratio >= 0.6 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                  {fmtPct(row.f_l_ratio)}
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary', border: '1px solid #e0e0e0' }}>
                データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell sx={{ position: 'sticky', bottom: 0, bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2', fontWeight: 'bold', color: 'primary.main', fontSize: '1rem' }}>
              月間合計
            </TableCell>
            <TableCell align="right" sx={{ position: 'sticky', bottom: 0, bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2', fontWeight: 'bold', color: 'primary.main', fontSize: '1rem' }}>
              {fmtYen(monthSales)}
            </TableCell>
            <TableCell align="right" sx={{ position: 'sticky', bottom: 0, bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2', fontWeight: 'bold', color: 'primary.main', fontSize: '1rem' }}>
              {fmtYen(monthWage)}
            </TableCell>
            <TableCell align="right" sx={{ position: 'sticky', bottom: 0, bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2', fontWeight: 'bold', color: 'primary.main', fontSize: '1rem' }}>
              {fmtYen(monthFoodCosts)}
            </TableCell>
            <TableCell align="right" sx={{ position: 'sticky', bottom: 0, bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2', fontWeight: 'bold', color: monthLRatio && monthLRatio >= 0.3 ? 'error.main' : 'success.main', fontSize: '1rem' }}>
              {fmtPct(monthLRatio)}
            </TableCell>
            <TableCell align="right" sx={{ position: 'sticky', bottom: 0, bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2', fontWeight: 'bold', color: monthFRatio && monthFRatio >= 0.3 ? 'error.main' : 'success.main', fontSize: '1rem' }}>
              {fmtPct(monthFRatio)}
            </TableCell>
            <TableCell align="right" sx={{ position: 'sticky', bottom: 0, bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2', fontWeight: 'bold', color: monthFLRatio && monthFLRatio >= 0.6 ? 'error.main' : 'success.main', fontSize: '1rem' }}>
              {fmtPct(monthFLRatio)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
