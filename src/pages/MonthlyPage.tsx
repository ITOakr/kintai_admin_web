import { useEffect, useMemo, useState } from "react";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
} from "@mui/material";
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getMonthlyLRatio, getMonthlyFRatio, getMonthlyFLRatio } from "../lib/api";

function fmtYen(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString("ja-JP") + " 円";
}
function fmtPct(x: number | null | undefined) {
  if (x == null) return "-";
  return (x * 100).toFixed(2) + " %";
}

// 日付を「日（曜日）」形式でフォーマットする関数
function fmtDateWithDay(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = weekDays[date.getDay()];
  return `${day}日（${dayOfWeek}）`;
}

interface MonthlyData {
  date: string;
  daily_sales: number | null;
  total_daily_wage: number;
  daily_food_costs: number | null;
  l_ratio: number | null;
  f_ratio: number | null;
  fl_ratio: number | null;
}

export default function MonthlyPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<MonthlyData[]>([]);
  const [monthSales, setMonthSales] = useState<number | null>(null);
  const [monthWage, setMonthWage] = useState(0);
  const [monthFoodCosts, setMonthFoodCosts] = useState<number | null>(null);
  const [monthLRatio, setMonthLRatio] = useState<number | null>(null);
  const [monthFRatio, setMonthFRatio] = useState<number | null>(null);
  const [monthFLRatio, setMonthFLRatio] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i); // 過去10年〜未来10年
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1); // 1月〜12月

  async function fetchMonthly() {
    try {
      setLoading(true);
      setErr(null);
      
      // 並行して3つのAPIを呼び出し
      const [lRes, fRes, flRes] = await Promise.all([
        getMonthlyLRatio(year, month),
        getMonthlyFRatio(year, month),
        getMonthlyFLRatio(year, month)
      ]);

      // データを統合
      const combinedRows: MonthlyData[] = lRes.days.map(lData => {
        const fData = fRes.days.find(d => d.date === lData.date);
        const flData = flRes.days.find(d => d.date === lData.date);
        
        return {
          date: lData.date,
          daily_sales: lData.daily_sales,
          total_daily_wage: lData.total_daily_wage,
          daily_food_costs: fData?.daily_food_cost ?? null,
          l_ratio: lData.l_ratio,
          f_ratio: fData?.f_ratio ?? null,
          fl_ratio: flData?.f_l_ratio ?? null,
        };
      });

      setRows(combinedRows);
      setMonthSales(lRes.monthly_sales);
      setMonthWage(lRes.monthly_wage);
      setMonthFoodCosts(fRes.monthly_food_cost);
      setMonthLRatio(lRes.monthly_l_ratio);
      setMonthFRatio(fRes.monthly_f_ratio);
      setMonthFLRatio(flRes.monthly_f_l_ratio);
    } catch (e: any) {
      setErr(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonthly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handlePrevYear = () => {
    setYear(year - 1);
  };
  
  const handleNextYear = () => {
    setYear(year + 1);
  };

  return (
    <Box sx={{ p: 3, minWidth: 1400, mx: '10%' }}>
      {/* ヘッダー部分 */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 55 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                月次レポート
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={handlePrevYear}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus':{ outline: 'none' } }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <FormControl sx={{ minWidth: 100 }} size="medium">
                {/* <InputLabel id="year-label">年</InputLabel> */}
                <InputLabel>年</InputLabel>
                <Select
                  value={year}
                  label="年"
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {yearOptions.map(y => (
                    <MenuItem key={y} value={y}>{y}年</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                onClick={handleNextYear}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus': { outline: 'none' } }}
              >
                <ChevronRightIcon />
              </IconButton>

              <IconButton
                onClick={handlePrevMonth}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus': { outline: 'none' } }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <FormControl sx={{ minWidth: 80 }} size="medium">
                {/* <InputLabel id="month-label">月</InputLabel> */}
                <InputLabel>月</InputLabel>
                <Select
                  value={month}
                  label="月"
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {monthOptions.map(m => (
                    <MenuItem key={m} value={m}>{m}月</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                onClick={handleNextMonth}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus': { outline: 'none' } }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
          
          {err && (
            <Box sx={{ mt: 2 }}>
              <Chip label={err} color="error" variant="outlined" />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* データテーブル */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            {year}年{month}月 日別データ
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '2px solid #e0e0e0' }}>
            <Table sx={{
              tableLayout: 'fixed',
              '& th, & td': {
                border: '1px solid #e0e0e0',
                padding: '12px 16px'
              },
              '& th': {
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                fontSize: '1.5rem'
              },
              '& td': {
                fontSize: '1.25rem'
              }
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
                  <TableRow key={row.date} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                    <TableCell sx={{ fontWeight: 'medium', width: '120px' }}>{fmtDateWithDay(row.date)}</TableCell>
                    <TableCell align="right" sx={{ width: '130px' }}>{fmtYen(row.daily_sales)}</TableCell>
                    <TableCell align="right" sx={{ width: '130px' }}>{fmtYen(row.total_daily_wage)}</TableCell>
                    <TableCell align="right" sx={{ width: '130px' }}>{fmtYen(row.daily_food_costs)}</TableCell>
                    <TableCell align="right" sx={{ width: '110px' }}>
                      <Box sx={{ 
                        color: row.l_ratio && row.l_ratio >= 0.3 ? 'error.main' : 'success.main',
                        fontWeight: 'bold'
                      }}>
                        {fmtPct(row.l_ratio)}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ width: '110px' }}>
                      <Box sx={{ 
                        color: row.f_ratio && row.f_ratio >= 0.3 ? 'error.main' : 'success.main',
                        fontWeight: 'bold'
                      }}>
                        {fmtPct(row.f_ratio)}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ width: '100px' }}>
                      <Box sx={{ 
                        color: row.fl_ratio && row.fl_ratio >= 0.6 ? 'error.main' : 'success.main',
                        fontWeight: 'bold'
                      }}>
                        {fmtPct(row.fl_ratio)}
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
              {/* 月間合計行 */}
              <TableHead>
                <TableRow sx={{ bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2' }}>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    width: '120px',
                    fontSize: '1rem'
                  }}>月間合計</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    width: '130px',
                    fontSize: '1rem'
                  }}>{fmtYen(monthSales)}</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    width: '130px',
                    fontSize: '1rem'
                  }}>{fmtYen(monthWage)}</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    width: '130px',
                    fontSize: '1rem'
                  }}>{fmtYen(monthFoodCosts)}</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    color: monthLRatio && monthLRatio >= 0.3 ? 'error.main' : 'success.main',
                    width: '110px',
                    fontSize: '1rem'
                  }}>
                    {fmtPct(monthLRatio)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    color: monthFRatio && monthFRatio >= 0.3 ? 'error.main' : 'success.main',
                    width: '110px',
                    fontSize: '1rem'
                  }}>
                    {fmtPct(monthFRatio)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    color: monthFLRatio && monthFLRatio >= 0.6 ? 'error.main' : 'success.main',
                    width: '100px',
                    fontSize: '1rem'
                  }}>
                    {fmtPct(monthFLRatio)}
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}