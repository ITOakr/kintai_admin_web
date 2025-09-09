// すでにログイン・adminチェックを通過している前提のメイン領域を差し替え
import { useEffect, useMemo, useState } from "react";
import { getDailyTotal, getSales, putSales, getLRatio } from "../lib/api.ts";
import { Grid } from '@mui/material';
import {
  Card, CardContent, CardActions,
  Typography, TextField, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TableFooter,
  Snackbar, Alert, Stack
} from "@mui/material";

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

  // 人件費一覧
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof getDailyTotal>>["rows"]
  >([]);
  const [totalWage, setTotalWage] = useState<number>(0);

  // 売上
  const [sales, setSales] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");

  // 比率
  const [ratio, setRatio] = useState<number | null>(null);

  const [snack, setSnack] = useState<{open:boolean; msg:string; sev:"success"|"error"}>({open:false, msg:"", sev:"success"});

  async function refreshAll(d = date) {
    try {
      setLoading(true);
      setErr(null);
      const [t, s, r] = await Promise.all([
        getDailyTotal(d),
        getSales(d),
        getLRatio(d),
      ]);
      setRows(t.rows);
      setTotalWage(t.total_daily_wage);

      setSales(s.amount_yen);
      setNote(s.note ?? "");

      setRatio(r.l_ratio);
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
      setRatio(r.l_ratio);
      setSnack({open:true, msg:"売上を保存しました", sev:"success"});
    } catch (e: any) {
      setErr(e?.message ?? "save failed");
      setSnack({open:true, msg:"保存に失敗しました", sev:"error"});
    } finally {
      setLoading(false);
    }
  }

  const monthLabel = useMemo(() => {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [date]);

  return (
    <Grid container spacing={2} sx={{ width: '100%', mt: 3, px: 2 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="end">
              <div>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>日付</Typography>
                <TextField
                  type="date"
                  size="small"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button variant="outlined" onClick={() => refreshAll()} disabled={loading}>
                {loading ? "更新中…" : "再計算"}
              </Button>
              <Typography sx={{ ml: "auto", opacity: 0.7 }}>{monthLabel}</Typography>
            </Stack>

            {err && (
              <Typography color="error" sx={{ mt: 1 }}>
                {err}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>人件費一覧</Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ユーザー</TableCell>
                  <TableCell align="right">実働</TableCell>
                  <TableCell align="right">休憩</TableCell>
                  <TableCell align="right">深夜</TableCell>
                  <TableCell align="right">基本時給</TableCell>
                  <TableCell align="right">日額人件費</TableCell>
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
                <TableRow>
                  <TableCell colSpan={5} align="right"><b>合計</b></TableCell>
                  <TableCell align="right"><b>{fmtYen(totalWage)}</b></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>売上入力</Typography>
            <Stack spacing={2}>
              <TextField
                label="金額（円）"
                type="number"
                value={sales ?? ""}
                onChange={(e) => setSales(e.target.value === "" ? null : Number(e.target.value))}
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
                onChange={(e) => setNote(e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>売上対人件費</Typography>
            <Stack spacing={0.5}>
              <Typography>売上：<b>{fmtYen(sales)}</b></Typography>
              <Typography>人件費合計：<b>{fmtYen(totalWage)}</b></Typography>
              <Typography>比率：<b>{ratio == null ? "-" : `${(ratio * 100).toFixed(2)} %`}</b></Typography>
            </Stack>
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={saveSales} disabled={loading}>
              {loading ? "保存中…" : "保存"}
            </Button>
          </CardActions>
        </Card>
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({...snack, open: false})}
        anchorOrigin={{ vertical: "bottom", horizontal: "center"}}
      >
        <Alert severity={snack.sev} onClose={() => setSnack({...snack, open: false})} sx={{ width: "100%"}}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Grid>
  );
}