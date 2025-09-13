// すでにログイン・adminチェックを通過している前提のメイン領域を差し替え
import { useEffect, useMemo, useState } from "react";
import { getDailyTotal, getSales, putSales, getFoodCosts, putFoodCosts, getLRatio, getFRatio , getFLRatio} from "../lib/api.ts";
import SalesBreakdownChart from "../components/SalesBreakdownChart.tsx";
import { Grid } from '@mui/material';
import {
  Card, CardContent, CardActions,
  Typography, TextField, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TableFooter,
  Snackbar, Alert, Stack, IconButton, Box, Popover
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale/ja";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Paid as PaidIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  LocalPizza as LocalPizzaIcon
} from "@mui/icons-material";
import { set } from "date-fns";
import { data } from "react-router-dom";

function fmtYen(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString("ja-JP") + " 円";
}
function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}時間${m}分`;
}

export default function AdminHomePage() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const calendarOpen = Boolean(anchorEl);

  const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setDate(newDate.toISOString().slice(0, 10));
      handleCalendarClose();
    }
  };

  // 人件費一覧
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof getDailyTotal>>["rows"]
  >([]);
  const [totalWage, setTotalWage] = useState<number>(0);

  // 売上
  const [sales, setSales] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");

  // 食材費
  const [foodCosts, setFoodCosts] = useState<number | null>(null);
  const [foodNote, setFoodNote] = useState<string>("");

  // 比率
  const [l_ratio, setLRatio] = useState<number | null>(null);
  const [f_ratio, setFRatio] = useState<number | null>(null);
  const [f_l_ratio, setFLratio] = useState<number | null>(null);

  // 編集状態の追跡
  const [isEdited, setIsEdited] = useState(false);
  const [originalSales, setOriginalSales] = useState<number | null>(null);
  const [originalNote, setOriginalNote] = useState<string>("");
  const [originalFoodCosts, setOriginalFoodCosts] = useState<number | null>(null);
  const [originalFoodNote, setOriginalFoodNote] = useState<string>("");

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" | "warning" }>({ open: false, msg: "", sev: "success" });

  async function refreshAll(d = date) {
    try {
      setLoading(true);
      setErr(null);

      const dataFetchPromise = await Promise.all([
        getDailyTotal(d),
        getSales(d),
        getFoodCosts(d),
        getLRatio(d),
        getFRatio(d),
        getFLRatio(d)
      ]);

      const nimimumWaitPromise = new Promise(resolve => setTimeout(resolve, 500)); // 最低待機時間500ms

      const [apiResults] = await Promise.all([
        dataFetchPromise,
        nimimumWaitPromise
      ]);

      const [t, s, f, r, fr, flr] = apiResults;

      setRows(t.rows);
      setTotalWage(t.total_daily_wage);

      setSales(s.amount_yen);
      setNote(s.note ?? "");
      setFoodCosts(f.amount_yen);
      setFoodNote(f.note ?? "");
      setOriginalSales(s.amount_yen);
      setOriginalNote(s.note ?? "");
      setOriginalFoodCosts(f.amount_yen);
      setOriginalFoodNote(f.note ?? "");
      setIsEdited(false);

      setLRatio(r.l_ratio);
      setFRatio(fr.f_ratio);
      setFLratio(flr.f_l_ratio);
    } catch (e: any) {
      setErr(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function saveSales() {
    try {
      setLoading(true);
      setErr(null);
      await putSales(date, Number(sales ?? 0), note || undefined);
      // 保存後、最新の比率を再計算して反映
      const r = await getLRatio(date);
      setLRatio(r.l_ratio);
      setOriginalSales(sales);
      setOriginalNote(note);
      setIsEdited(false);
      setSnack({ open: true, msg: "売上を保存しました", sev: "success" });
    } catch (e: any) {
      setErr(e?.message ?? "save failed");
      setSnack({ open: true, msg: "保存に失敗しました", sev: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function saveFoodCosts() {
    try {
      setLoading(true);
      setErr(null);
      await putFoodCosts(date, Number(foodCosts ?? 0), foodNote || undefined);
      // 保存後、最新の比率を再計算して反映
      const fr = await getFRatio(date);
      setFRatio(fr.f_ratio);
      setOriginalFoodCosts(foodCosts);
      setOriginalFoodNote(foodNote);
      setIsEdited(false);
      setSnack({ open: true, msg: "食材費を保存しました", sev: "success" });
    } catch (e: any) {
      setErr(e?.message ?? "save failed");
      setSnack({ open: true, msg: "保存に失敗しました", sev: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    try {
      setLoading(true);
      setErr(null);

      // 1. 売上と食材費の保存リクエストを同時に実行
      await Promise.all([
        putSales(date, Number(sales ?? 0), note || undefined),
        putFoodCosts(date, Number(foodCosts ?? 0), foodNote || undefined)
      ]);

      // 2. 両方の保存が成功したら、すべてのデータを再取得して画面を完全に同期させる
      //    これにより、L, F, FL比率がすべて正しく更新される
      await refreshAll(date);
      
      setSnack({ open: true, msg: "保存しました", sev: "success" });

    } catch (e: any) {
      setErr(e?.message ?? "save failed");
      setSnack({ open: true, msg: "保存に失敗しました", sev: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Grid container spacing={2} sx={{ width: '100%', mt: 3, px: 2 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card elevation={6} sx={{ boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  人件費一覧
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => refreshAll()}
                type="button"
                disabled={loading}
                startIcon={<RefreshIcon />}
                size="small"
                sx={{ zIndex: 1 }}
              >
                {loading ? "更新中…" : "再計算"}
              </Button>
            </Box>

            <Stack direction="column" spacing={1} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  mb: 2,
                  height: '42px'
                }}
              >
                <Button
                  onClick={(e) => {
                    const newDate = new Date(date);
                    newDate.setDate(newDate.getDate() - 1);
                    setDate(newDate.toISOString().slice(0, 10));
                    e.currentTarget.blur();
                  }}
                  sx={{
                    bgcolor: '#f8f9fa',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '4px 0 0 4px',
                    borderRight: 0,
                    minWidth: '50px',
                    '&:hover': { bgcolor: '#e9ecef' }
                  }}
                >
                  <ChevronLeftIcon />
                </Button>

                <Box
                  onClick={handleDateClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f8f9fa',
                    borderTop: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 3,
                    minWidth: '300px',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#e9ecef' },
                  }}>
                  {(() => {
                    const selectedDate = new Date(date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    selectedDate.setHours(0, 0, 0, 0);

                    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
                    const dateString = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${weekDays[selectedDate.getDay()]}）`;

                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '40px' }}>
                        <Typography>{dateString}</Typography>
                        {selectedDate.getTime() === today.getTime() && (
                          <Typography
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              ml: 1
                            }}
                          >
                            本日
                          </Typography>
                        )}
                      </Box>
                    );
                  })()}
                </Box>

                <Button
                  onClick={(e) => {
                    const newDate = new Date(date);
                    newDate.setDate(newDate.getDate() + 1);
                    setDate(newDate.toISOString().slice(0, 10));
                    e.currentTarget.blur();
                  }}
                  sx={{
                    bgcolor: '#f8f9fa',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '0 4px 4px 0',
                    borderLeft: 0,
                    minWidth: '50px',
                    '&:hover': { bgcolor: '#e9ecef' }
                  }}
                >
                  <ChevronRightIcon />
                </Button>
              </Box>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ display: 'none' }}
              />
            </Stack>

            {err && (
              <Typography color="error" sx={{ mt: 1 }}>
                {err}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Table size="small" sx={{
              '& th': {
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                fontSize: '1.1rem'
              },
              '& td': {
                fontSize: '1.1rem'
              },
              '& th, & td': {
                border: 1,
                borderColor: 'divider',
                padding: '12px' // より大きなフォントに合わせてパディングも調整
              }
            }}>
              <TableHead>
                <TableRow>
                  <TableCell>名前</TableCell>
                  <TableCell align="right">実働</TableCell>
                  <TableCell align="right">休憩</TableCell>
                  <TableCell align="right">深夜</TableCell>
                  <TableCell align="right">基本時給</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#f8f9fa' }}>日額人件費</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id} hover>
                    <TableCell>{r.user_name} (ID:{r.user_id})</TableCell>
                    <TableCell align="right">{minutesToHM(r.work_minutes)}</TableCell>
                    <TableCell align="right">{minutesToHM(r.break_minutes)}</TableCell>
                    <TableCell align="right">{minutesToHM(r.night_minutes)}</TableCell>
                    <TableCell align="right">{fmtYen(r.base_hourly_wage)}</TableCell>
                    <TableCell align="right"><b>{fmtYen(r.daily_wage)}</b></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: "text.secondary" }}>
                      当日の勤務データがありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell colSpan={5} align="right" sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>合計</TableCell>
                  <TableCell align="right" sx={{
                    fontSize: '1.6rem',
                    fontWeight: 'bold',
                    color: 'text.primary',
                    padding: '16px 12px'
                  }}>{fmtYen(totalWage)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <Box sx={{ mt: 2 }}>
          <SalesBreakdownChart
            sales={sales}
            totalWage={totalWage}
            foodCosts={foodCosts}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={6} sx={{ boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            saveAll();
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PaidIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  売上入力
                </Typography>
              </Box>
              <Stack spacing={2}>
                <TextField
                  label="金額（円）"
                  type="text"
                  value={sales ?? ""}
                  onChange={(e) => {
                    // 全角数字を半角数字に変換
                    const normalized = e.target.value
                      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                      .replace(/[^0-9]/g, ''); // 数字以外を除去

                    const newValue = normalized === "" ? null : Number(normalized);
                    setSales(newValue);
                    const hasChanges = newValue !== originalSales || note !== originalNote;
                    setIsEdited(hasChanges);

                    // 最初の編集時のみスナックバー警告を表示
                    if (hasChanges && !isEdited) {
                      setSnack({
                        open: true,
                        msg: "変更が保存されていません",
                        sev: "warning"
                      });
                    }
                  }}
                  fullWidth
                  slotProps={{
                    input: {
                      inputMode: "numeric"
                    }
                  }}
                />
                <TextField
                  label="メモ（任意）"
                  value={note}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setNote(newValue);
                    const hasChanges = newValue !== originalNote || sales !== originalSales;
                    setIsEdited(hasChanges);

                    // 最初の編集時のみスナックバー警告を表示
                    if (hasChanges && !isEdited) {
                      setSnack({
                        open: true,
                        msg: "変更が保存されていません",
                        sev: "warning"
                      });
                    }
                  }}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalPizzaIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  食材費入力
                </Typography>
              </Box>

              <Stack spacing={2}>
                <TextField
                  label="金額（円）"
                  type="text"
                  value={foodCosts ?? ""}
                  onChange={(e) => {
                    // 全角数字を半角数字に変換
                    const normalized = e.target.value
                      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                      .replace(/[^0-9]/g, ''); // 数字以外を除去

                    const newValue = normalized === "" ? null : Number(normalized);
                    setFoodCosts(newValue);
                    const hasChanges = newValue !== originalFoodCosts || foodNote !== originalFoodNote;
                    setIsEdited(hasChanges);

                    // 最初の編集時のみスナックバー警告を表示
                    if (hasChanges && !isEdited) {
                      setSnack({
                        open: true,
                        msg: "変更が保存されていません",
                        sev: "warning"
                      });
                    }
                  }}
                  fullWidth
                  slotProps={{
                    input: {
                      inputMode: "numeric"
                    }
                  }}
                />
                <TextField
                  label="メモ（任意）"
                  value={foodNote}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFoodNote(newValue);
                    const hasChanges = newValue !== originalFoodNote || foodCosts !== originalFoodCosts;
                    setIsEdited(hasChanges);

                    // 最初の編集時のみスナックバー警告を表示
                    if (hasChanges && !isEdited) {
                      setSnack({
                        open: true,
                        msg: "変更が保存されていません",
                        sev: "warning"
                      });
                    }
                  }}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AssessmentIcon color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    売上対人件費
                  </Typography>
                </Box>

                <Box sx={{
                  bgcolor: '#f8f9fa',
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider'
                }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>売上：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {fmtYen(sales)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>人件費：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {fmtYen(totalWage)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>比率：</Typography>
                      <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: l_ratio && l_ratio >= 0.3 ? 'error.main' : 'success.main'
                      }}>
                        {l_ratio == null ? "-" : `${(l_ratio * 100).toFixed(2)} %`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AssessmentIcon color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    売上対食材費
                  </Typography>
                </Box>

                <Box sx={{
                  bgcolor: '#f8f9fa',
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider'
                }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>売上：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {fmtYen(sales)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>食材費：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {fmtYen(foodCosts)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>比率：</Typography>
                      <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: f_ratio && f_ratio >= 0.3 ? 'error.main' : 'success.main'
                      }}>
                        {f_ratio == null ? "-" : `${(f_ratio * 100).toFixed(2)} %`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AssessmentIcon color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    FL比率
                  </Typography>
                </Box>

                <Box sx={{
                  bgcolor: '#f8f9fa',
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider'
                }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>売上：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {fmtYen(sales)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>食材費＋人件費：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {fmtYen((foodCosts ?? 0) + totalWage)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>比率：</Typography>
                      <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: f_l_ratio && f_l_ratio >= 0.6 ? 'error.main' : 'success.main'
                      }}>
                        {f_l_ratio == null ? "-" : `${(f_l_ratio * 100).toFixed(2)} %`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                {loading ? "保存中…" : "保存"}
              </Button>
            </CardActions>
          </form>
        </Card>
      </Grid>

      {/* 保存完了・エラー用のスナックバー */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* 未保存の変更がある場合の固定アラート */}
      <Snackbar
        open={isEdited}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: snack.open ? '80px' : '20px' }} // 他のスナックバーがある場合は上にずらす
      >
        <Alert
          severity="warning"
          sx={{
            width: "100%",
            boxShadow: 3,
            '& .MuiAlert-icon': { fontSize: '1.5rem' }
          }}
          icon={<WarningIcon sx={{ fontSize: '24px' }} />}
        >
          変更が保存されていません
        </Alert>
      </Snackbar>

      <Popover
        open={calendarOpen}
        anchorEl={anchorEl}
        onClose={handleCalendarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ mt: 1 }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <DateCalendar
            value={new Date(date)}
            onChange={handleDateChange}
            sx={{ bgcolor: 'background.paper' }}
          />
        </LocalizationProvider>
      </Popover>
    </Grid>
  );
}