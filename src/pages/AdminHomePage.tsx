// すでにログイン・adminチェックを通過している前提のメイン領域を差し替え
import { useEffect, useMemo, useState } from "react";
import { Form, useSearchParams } from "react-router-dom";
import { getDailySummary, getFoodCosts, putSales, FoodCostItem, putFoodCosts, putDailyFixedCosts, DailySummary } from "../lib/api.ts";
import SalesBreakdownChart from "../components/SalesBreakdownChart.tsx";
import { Grid, Input, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
  Card, CardContent, CardActions,
  Typography, TextField, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TableFooter,
  Snackbar, Alert, Stack, IconButton, Box, Popover, InputAdornment
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
  LocalPizza as LocalPizzaIcon,
  FiberManualRecord as FiberManualRecordIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { formatYen, minutesToHM } from "../utils/formatters";
import DateNavigator from "../components/DateNavigator";
import WageTable from "../components/WageTable";

const FOOD_CATEGORIES = {
  meat: "肉類",
  ingredient: "食材",
  drink: "ドリンク",
  other: "その他"
};

export default function AdminHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState<string>(() => {
    const dateParam = searchParams.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    return new Date().toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const updateDate = (newDate: string) => {
    setDate(newDate);
    setSearchParams({ date: newDate });
  };

  // 社員の人数を管理
  const [employeeCount, setEmployeeCount] = useState(1);

  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  // 売上
  const [sales, setSales] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");

  // 食材費
  const [foodCostItems, setFoodCostItems] = useState<FoodCostItem[]>([]);
  const totalFoodCosts = useMemo(() => {
    return foodCostItems.reduce((sum, item) => sum + item.amount_yen, 0);
  }, [foodCostItems]);

  // 編集状態の追跡
  const [isEdited, setIsEdited] = useState(false);

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" | "warning" }>({ open: false, msg: "", sev: "success" });

  async function refreshAll(d = date) {
    try {
      setLoading(true);
      setErr(null);

      const [apiResults] = await Promise.all([
        getDailySummary(d),
        new Promise(resolve => setTimeout(resolve, 300)) // 最低待機時間300ms
      ]);

      setDailySummary(apiResults);
      setSales(apiResults.sales ?? null);
      setNote(apiResults.sales_note ?? "");
      setEmployeeCount(apiResults.full_time_employee_count ?? 1);
      const foodCosts = await getFoodCosts(d);
      setFoodCostItems(foodCosts);

      setIsEdited(false);
    } catch (e: any) {
      setErr(e?.message ?? "データの取得に失敗しました");
      setDailySummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const handleFoodCostItemChange = (index: number, field: keyof FoodCostItem, value: string | number) => {
    const newItems = [...foodCostItems];
    let processedValue = value;
    if (field === "amount_yen") {
      // 全角数字を半角数字に変換
      const normalized = String(value)
        .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/[^0-9]/g, ''); // 数字以外の文字を除去
      processedValue = normalized === "" ? 0 : Number(normalized);
    }
    (newItems[index] as any)[field] = processedValue;
    setFoodCostItems(newItems);
    setIsEdited(true);
  };

  const addFoodCostItem = () => {
    setFoodCostItems([...foodCostItems, { category: "meat", amount_yen: 0, note: "" }]);
    setIsEdited(true);
  };

  const removeFoodCostItem = (index: number) => {
    const newItems = foodCostItems.filter((_, i) => i !== index);
    setFoodCostItems(newItems);
    setIsEdited(true);
  };

  async function saveAll() {
    try {
      setLoading(true);
      setErr(null);

      // 1. 売上と食材費の保存リクエストを同時に実行
      await Promise.all([
        putSales(date, Number(sales ?? 0), note || undefined),
        putFoodCosts(date, foodCostItems),
        putDailyFixedCosts(date, employeeCount)
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
                onClick={() => refreshAll(date)}
                type="button"
                disabled={loading}
                startIcon={<RefreshIcon />}
                size="small"
                sx={{ zIndex: 1, '&:focus': { outline: 'none' } }}
              >
                {loading ? "更新中…" : "再計算"}
              </Button>
            </Box>

            <DateNavigator date={date} onDateChange={updateDate} />

            {err && (
              <Typography color="error" sx={{ mt: 1 }}>
                {err}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />
            <WageTable
              dailySummary={dailySummary}
              employeeCount={employeeCount}
              onEmployeeCountChange={setEmployeeCount}
              onEdit={() => setIsEdited(true)}
            />
          </CardContent>
        </Card>

        <Box sx={{ mt: 2 }}>
          <SalesBreakdownChart
            sales={dailySummary?.sales ?? null}
            totalWage={dailySummary?.total_wage ?? 0}
            foodCosts={totalFoodCosts}
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
                    setIsEdited(true);
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
                    setNote(e.target.value);
                    setIsEdited(true);
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
                {foodCostItems.map((item, index) => (
                  <Box key={index} sx={{ border: '1px solid #e0e0e0', p: 1.5, borderRadius: 1 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>カテゴリ</InputLabel>
                          <Select
                            value={item.category}
                            label="カテゴリ"
                            onChange={(e) => handleFoodCostItemChange(index, "category", e.target.value)}
                          >
                            {Object.entries(FOOD_CATEGORIES).map(([key, label]) => (
                              <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="金額（円）"
                          type="text"
                          size="small"
                          value={item.amount_yen}
                          onChange={(e) => {
                            handleFoodCostItemChange(index, "amount_yen", e.target.value);
                          }}
                          sx={{ flex: 1 }}
                          slotProps={{
                            input: {
                              inputMode: "numeric"
                            }
                          }}
                        />
                        <IconButton
                          onClick={() => removeFoodCostItem(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                      <TextField
                        label="メモ（任意）"
                        size="small"
                        value={item.note ?? ""}
                        onChange={(e) => {
                          handleFoodCostItemChange(index, "note", e.target.value);
                        }}
                        fullWidth
                      />
                    </Stack>
                  </Box>
                ))}
                <Button startIcon={<AddCircleOutlineIcon />} onClick={addFoodCostItem}>
                  項目を追加
                </Button>
                <Typography align="right" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  合計: {formatYen(totalFoodCosts)}
                </Typography>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={4}>
                {/* L比計算 */}
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
                        {formatYen(dailySummary?.sales ?? 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>人件費：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {formatYen(dailySummary?.total_wage ?? 0)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>比率：</Typography>
                      <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: dailySummary?.l_ratio && dailySummary?.l_ratio >= 0.3 ? 'error.main' : 'success.main'
                      }}>
                        {dailySummary?.l_ratio == null ? "-" : `${(dailySummary?.l_ratio * 100).toFixed(2)} %`}
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
                        {formatYen(dailySummary?.sales ?? 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>食材費：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {formatYen(totalFoodCosts ?? 0)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>比率：</Typography>
                      <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: dailySummary?.f_ratio && dailySummary?.f_ratio >= 0.3 ? 'error.main' : 'success.main'
                      }}>
                        {dailySummary?.f_ratio == null ? "-" : `${(dailySummary?.f_ratio * 100).toFixed(2)} %`}
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
                        {formatYen(sales)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>食材費＋人件費：</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {formatYen((totalFoodCosts ?? 0) + (dailySummary?.total_wage ?? 0))}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.secondary' }}>比率：</Typography>
                      <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: dailySummary?.f_l_ratio && dailySummary?.f_l_ratio >= 0.6 ? 'error.main' : 'success.main'
                      }}>
                        {dailySummary?.f_l_ratio == null ? "-" : `${(dailySummary?.f_l_ratio * 100).toFixed(2)} %`}
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
                sx={{ '&:focus': { outline: 'none' } }}
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
    </Grid>
  );
}