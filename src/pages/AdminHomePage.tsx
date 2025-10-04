// すでにログイン・adminチェックを通過している前提のメイン領域を差し替え
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailySummary, getFoodCosts, putSales, FoodCostItem, putFoodCosts, putDailyFixedCosts, DailySummary } from "../lib/api.ts";
import SalesBreakdownChart from "../components/SalesBreakdownChart.tsx";
import { Grid } from '@mui/material';
import {
  Card, CardContent, CardActions,
  Typography, Button, Divider,
  Snackbar, Alert, Box,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import DateNavigator from "../components/DateNavigator";
import WageTable from "../components/WageTable";
import SalesInputForm from "../components/SalesInputForm";
import FoodCostForm from "../components/FoodCostForm";
import FinancialMetrics from "../components/FinancialMetrics";

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
  const totalFoodCosts = foodCostItems.reduce((sum, item) => sum + item.amount_yen, 0);

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
              <SalesInputForm
                sales={sales}
                note={note}
                onSalesChange={setSales}
                onNoteChange={setNote}
                onEdit={() => setIsEdited(true)}
              />

              <Divider sx={{ my: 2 }} />

              <FoodCostForm
                items={foodCostItems}
                onItemsChange={setFoodCostItems}
                onEdit={() => setIsEdited(true)}
              />

              <Divider sx={{ my: 2 }} />

              <FinancialMetrics
                dailySummary={dailySummary}
                totalFoodCosts={totalFoodCosts}
              />

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