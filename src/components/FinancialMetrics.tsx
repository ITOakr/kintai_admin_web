import {
  Box,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { DailySummary } from "../lib/api";
import { formatYen } from "../utils/formatters";

// このコンポーネントが受け取るPropsの型を定義
interface FinancialMetricsProps {
  dailySummary: DailySummary | null;
  totalFoodCosts: number;
}

// L, F, FL比率を表示する部分をまとめた小さなコンポーネント
const MetricDisplay = ({ title, value1Label, value1, value2Label, value2, ratioLabel, ratio, ratioColor }: any) => (
  <>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <AssessmentIcon color="primary" sx={{ fontSize: 28 }} />
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: 'text.secondary' }}>{value1Label}：</Typography>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            {formatYen(value1)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: 'text.secondary' }}>{value2Label}：</Typography>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            {formatYen(value2)}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: 'text.secondary' }}>{ratioLabel}：</Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: ratioColor }}>
            {ratio == null ? "-" : `${(ratio * 100).toFixed(2)} %`}
          </Typography>
        </Box>
      </Stack>
    </Box>
  </>
);


export default function FinancialMetrics({ dailySummary, totalFoodCosts }: FinancialMetricsProps) {
  const sales = dailySummary?.sales ?? null;
  const totalWage = dailySummary?.total_wage ?? 0;

  return (
    <Stack spacing={4}>
      {/* L比率 */}
      <MetricDisplay
        title="売上対人件費"
        value1Label="売上"
        value1={sales}
        value2Label="人件費"
        value2={totalWage}
        ratioLabel="比率"
        ratio={dailySummary?.l_ratio}
        ratioColor={dailySummary?.l_ratio && dailySummary.l_ratio >= 0.3 ? 'error.main' : 'success.main'}
      />

      {/* F比率 */}
      <MetricDisplay
        title="売上対食材費"
        value1Label="売上"
        value1={sales}
        value2Label="食材費"
        value2={totalFoodCosts}
        ratioLabel="比率"
        ratio={dailySummary?.f_ratio}
        ratioColor={dailySummary?.f_ratio && dailySummary.f_ratio >= 0.3 ? 'error.main' : 'success.main'}
      />

      {/* FL比率 */}
      <MetricDisplay
        title="FL比率"
        value1Label="売上"
        value1={sales}
        value2Label="食材費＋人件費"
        value2={totalFoodCosts + totalWage}
        ratioLabel="比率"
        ratio={dailySummary?.f_l_ratio}
        ratioColor={dailySummary?.f_l_ratio && dailySummary.f_l_ratio >= 0.6 ? 'error.main' : 'success.main'}
      />
    </Stack>
  );
}