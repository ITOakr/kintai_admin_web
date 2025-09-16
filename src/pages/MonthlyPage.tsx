import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { getMonthlyLRatio, getMonthlyFRatio, getMonthlyFLRatio } from "../lib/api";
import MonthlyReportHeader from "../components/MonthlyReportHeader";
import MonthlyReportTable from "../components/MonthlyReportTable";
import ExcelDownloadButton from "../components/ExcelDownloadButton";

// 月次データの型定義
export interface MonthlyData {
  date: string;
  daily_sales: number | null;
  total_daily_wage: number;
  daily_food_costs: number | null;
  l_ratio: number | null;
  f_ratio: number | null;
  fl_ratio: number | null;
}

export default function MonthlyPage() {
  // --- 状態管理 (State) ---
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
  const fileName = `月次レポート_${year}年${month}月.xlsx`;
  const formattedRowsforExcel = rows.map(row => ({
    '日付': row.date,
    '売上(円)': row.daily_sales,
    '人件費(円)': row.total_daily_wage,
    '食材費(円)': row.daily_food_costs,
    'L比率(%)': row.l_ratio ? (row.l_ratio * 100).toFixed(2) : null,
    'F比率(%)': row.f_ratio ? (row.f_ratio * 100).toFixed(2) : null,
    'FL比率(%)': row.fl_ratio ? (row.fl_ratio * 100).toFixed(2) : null,
  }));

  // --- データ取得ロジック ---
  async function fetchMonthly() {
    try {
      setLoading(true);
      setErr(null);
      
      const [lRes, fRes, flRes] = await Promise.all([
        getMonthlyLRatio(year, month),
        getMonthlyFRatio(year, month),
        getMonthlyFLRatio(year, month)
      ]);

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
            rows={rows}
            monthSales={monthSales}
            monthWage={monthWage}
            monthFoodCosts={monthFoodCosts}
            monthLRatio={monthLRatio}
            monthFRatio={monthFRatio}
            monthFLRatio={monthFLRatio}
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

