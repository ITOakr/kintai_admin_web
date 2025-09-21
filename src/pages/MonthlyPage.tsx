import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { getMonthlySummary, MonthlySummaryResponse } from "../lib/api";
import MonthlyReportHeader from "../components/MonthlyReportHeader";
import MonthlyReportTable from "../components/MonthlyReportTable";
import ExcelDownloadButton from "../components/ExcelDownloadButton";

export default function MonthlyPage() {
  // --- 状態管理 (State) ---
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryResponse | null>(null);

  const fileName = `月次レポート_${year}年${month}月.xlsx`;
  const formattedRowsforExcel = monthlySummary?.days.map(row => ({
    '日付': row.date,
    '売上(円)': row.daily_sales,
    '人件費(円)': row.total_daily_wage,
    '食材費(円)': row.daily_food_costs,
    'L比率(%)': row.l_ratio ? (row.l_ratio * 100).toFixed(2) : null,
    'F比率(%)': row.f_ratio ? (row.f_ratio * 100).toFixed(2) : null,
    'FL比率(%)': row.f_l_ratio ? (row.f_l_ratio * 100).toFixed(2) : null,
  })) ?? [];

  // --- データ取得ロジック ---
  async function fetchMonthly() {
    try {
      setLoading(true);
      setErr(null);
      
      const res = await getMonthlySummary(year, month);
      setMonthlySummary(res);

    } catch (e: any) {
      setErr(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonthly();
  }, [year, month]);

  // --- イベントハンドラ ---
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

  const handlePrevYear = () => { setYear(year - 1); };
  const handleNextYear = () => { setYear(year + 1); };

  // --- 描画ロジック ---
  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* ヘッダーコンポーネントを呼び出し */}
      <MonthlyReportHeader
        year={year}
        month={month}
        loading={loading}
        err={err}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onPrevYear={handlePrevYear}
        onNextYear={handleNextYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onExportClick={() => {
          const button = document.getElementById('excel-download-button');
          if (button) {
            button.click();
          }
        }}
      />

      {/* テーブルコンポーネントを呼び出し */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            {year}年{month}月 日別データ
          </Typography>
          <MonthlyReportTable
            rows={monthlySummary?.days ?? []}
            monthSales={monthlySummary?.monthly_sales ?? null}
            monthWage={monthlySummary?.monthly_wage ?? 0}
            monthFoodCosts={monthlySummary?.monthly_food_costs ?? null}
            monthLRatio={monthlySummary?.monthly_l_ratio ?? null}
            monthFRatio={monthlySummary?.monthly_f_ratio ?? null}
            monthFLRatio={monthlySummary?.monthly_f_l_ratio ?? null}
          />
        </CardContent>
      </Card>
      <div style={{ display: 'none' }}>
        <ExcelDownloadButton
          data={formattedRowsforExcel}
          fileName={fileName}
          buttonName="Excel Download"
          id="excel-download-button"
        />
      </div>
    </Box>
  );
}
