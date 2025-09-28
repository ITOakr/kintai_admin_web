import { PieChart } from '@mui/x-charts/PieChart';
import { Card, CardContent, Typography, Box } from '@mui/material';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import { formatYen } from '../utils/formatters';

interface SalesBreakdownChartProps {
  sales: number | null;
  totalWage: number;
  foodCosts: number;
}

const CustomLegend = ({ data, colors }: { data: any[]; colors: string[] }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center' }}>
    {data.map((item, index) => (
      // labelがないデータ（「その他」など）は凡例に表示しない
      item.label ? (
        <Box key={item.id} sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: colors[index], // グラフと同じ色を適用
              mr: 1, // 右側に余白
            }}
          />
          <Typography variant="h6">{item.label}</Typography>
        </Box>
      ) : null
    ))}
  </Box>
);

export default function SalesBreakdownChart({ sales, totalWage, foodCosts }: SalesBreakdownChartProps) {
  // 売上データがない、または0の場合はグラフを表示しない
  if (!sales || sales <= 0) {
    return (
      <Card elevation={6} sx={{ boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <DataUsageIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            売上構成
          </Typography>
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">売上データがありません</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const foodCostsValue = foodCosts ?? 0;
  const otherCosts = sales - totalWage - foodCostsValue;

  // FLコスト（人件費＋食材費）の比率を計算
  const flRatio = (totalWage + foodCostsValue) / sales;
  const isHighCost = flRatio > 0.6; // 60%を超えているかどうかのフラグ

  // グラフに渡すデータを作成（その他は凡例に表示しない）
  const data = [
    { id: 0, value: totalWage, label: '人件費' },
    { id: 1, value: foodCostsValue, label: '食材費' },
    // 「その他」がマイナスにならないように調整（ラベルなしで凡例に表示されない）
    { id: 2, value: Math.max(0, otherCosts) },
  ];

  // FLコストが60%を超えている場合、警告色（赤系）に設定
  const chartColors = isHighCost
    ? ['#1976d2', '#fbc02d', '#d32f2f'] // 赤、オレンジ、グレー
    : ['#1976d2', '#fbc02d', '#4caf50']; // 青、黄、グレー

  return (
    <Card elevation={6} sx={{ boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DataUsageIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            売上構成
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 600 }}>
          <Box sx={{ position: 'relative', width: '70%' }}>
            <PieChart
              width={550}
              height={550}
              hideLegend
              series={[
                {
                  data,
                  innerRadius: 200,
                  outerRadius: 260,
                  cx: '50%',
                  cy: '50%',
                  highlightScope: { fade: 'global', highlight: 'item' },
                  faded: { innerRadius: 210, additionalRadius: -5, color: 'gray' },
                },
              ]}
              colors={chartColors}
              // margin={{ top: 40, bottom: 40, left: 40, right: 40 }}
            />
            {/* 中央に売上を表示するためのBox */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography component="div" variant="h5" color="text.secondary" sx={{ mb: 0.5 }}>
                売上
              </Typography>
              <Typography component="div" variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatYen(sales)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ width: '30%', pl: 2 }}>
            <CustomLegend data={data} colors={chartColors} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
