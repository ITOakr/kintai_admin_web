import { Box, Card, CardContent, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { LineChart, ChartsReferenceLine } from '@mui/x-charts';
import { MonthlySummaryResponse } from '../lib/api';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

type SeriesItem = {
  label: string;
  data: (number | null)[];
  color: string;
  valueFormatter: (value: number | null) => string;
};

interface MonthlyReportChartProps {
  data: MonthlySummaryResponse | null;
}

export default function MonthlyReportChart({ data }: MonthlyReportChartProps) {
  const navigate = useNavigate();

  const [visibleSeries, setVisibleSeries] = useState({
    fRatio: true,
    lRatio: true,
    flRatio: true,
    cumulativeFLRatio: true,
  });


  const seriesData = useMemo(() => {
    if (!data || !data.days || data.days.length === 0) {
      return { xAxisData: [], series: [], yAxisMax: 100 };
    }

    const xAxisData = data.days.map(day => new Date(day.date).getDate());
    const fRatioData = data.days.map(day => day.f_ratio ? day.f_ratio * 100 : null);
    const lRatioData = data.days.map(day => day.l_ratio ? day.l_ratio * 100 : null);
    const flRatioData = data.days.map(day => day.f_l_ratio ? day.f_l_ratio * 100 : null);
    const cumulativeFLRatioData = data.days.map(day => day.cumulative_f_l_ratio ? day.cumulative_f_l_ratio * 100 : null);

    const series: SeriesItem[] = [];
    if (visibleSeries.fRatio) series.push(
      {
        label: 'F比率',
        data: fRatioData,
        color: '#fbc02d',
        valueFormatter: (v) => v ? `${v.toFixed(2)}%` : ''
      });
    if (visibleSeries.lRatio) series.push(
      {
        label: 'L比率',
        data: lRatioData,
        color: '#1976d2',
        valueFormatter: (v) => v ? `${v.toFixed(2)}%` : ''
      });
    if (visibleSeries.flRatio) series.push(
      {
        label: 'FL比率',
        data: flRatioData,
        color: '#4caf50',
        valueFormatter: (v) => v ? `${v.toFixed(2)}%` : ''
      });
    if (visibleSeries.cumulativeFLRatio) series.push(
      {
        label: '累積FL比率',
        data: cumulativeFLRatioData,
        color: '#ef5350',
        valueFormatter: (v) => v ? `${v.toFixed(2)}%` : ''
      });

    const allVisibleData = series.flatMap(s => s.data);
    const validNumbers = allVisibleData.filter(v => v !== null) as number[];
    const maxValueInSeries = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;
    const yAxisMax = Math.max(100, maxValueInSeries);

    return { xAxisData, series, yAxisMax };
  }, [data, visibleSeries]); // dataかvisibleSeriesが変わった時だけ再計算

  const handleSeriesToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVisibleSeries({
      ...visibleSeries,
      [event.target.name]: event.target.checked,
    });
  };

  const handleChartItemClick = (event: React.MouseEvent, params: any) => {
    if (params && params.dataIndex !== undefined && data?.days) {
      const clickedDataIndex = params.dataIndex;
      const targetDate = data.days[clickedDataIndex].date;
      navigate(`/?date=${targetDate}`);
    }
  };

  // データがない場合の早期リターンは、フック呼び出しの後に置く
  if (!data || !data.days || data.days.length === 0) {
    return (
      <Card elevation={3} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            月次レポートグラフ
          </Typography>
          <Typography>データがありません</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3} sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          月次レポートグラフ
        </Typography>

        <FormGroup row sx={{ mb: 2, justifyContent: 'center' }}>
          <FormControlLabel
            control={<Checkbox checked={visibleSeries.fRatio} onChange={handleSeriesToggle} name="fRatio" sx={{ color: '#fbc02d', '&.Mui-checked': { color: '#fbc02d' } }} />}
            label="F比率"
          />
          <FormControlLabel
            control={<Checkbox checked={visibleSeries.lRatio} onChange={handleSeriesToggle} name="lRatio" sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }} />}
            label="L比率"
          />
          <FormControlLabel
            control={<Checkbox checked={visibleSeries.flRatio} onChange={handleSeriesToggle} name="flRatio" sx={{ color: '#4caf50', '&.Mui-checked': { color: '#4caf50' } }} />}
            label="FL比率"
          />
          <FormControlLabel
            control={<Checkbox checked={visibleSeries.cumulativeFLRatio} onChange={handleSeriesToggle} name="cumulativeFLRatio" sx={{ color: '#ef5350', '&.Mui-checked': { color: '#ef5350' } }} />}
            label="累積FL比率"
          />
        </FormGroup>
        <Box sx={{ width: '100%' }}>
          <LineChart
            height={500}
            xAxis={[{
              data: seriesData.xAxisData,
              scaleType: 'band',
              valueFormatter: (value) => `${value}日`,
            }]}
            yAxis={[{
              max: seriesData.yAxisMax,
              min: 0,
              valueFormatter: (value) => `${value}%`,
            }]}
            series={seriesData.series}
            onAxisClick={(event, axisData) => {
              if (axisData && axisData.axisValue !== undefined && axisData.axisValue !== null) {
                // xAxisのデータ（日付）から対応する日のデータを探す
                const dayIndex = seriesData.xAxisData.findIndex(day => day === axisData.axisValue);
                if (dayIndex !== -1 && data?.days) {
                  const targetDate = data.days[dayIndex].date;
                  navigate(`/?date=${targetDate}`);
                  window.scrollTo(0, 0);
                }
              }
            }}
            sx={{ '& .MuiLineElement-root': { cursor: 'pointer' } }}
          >
            <ChartsReferenceLine
              y={60}
              label="FL目標 (60%)"
              lineStyle={{ stroke: '#ef5350', strokeDasharray: '5 5' }}
              labelStyle={{ fill: '#ef5350' }}
            />
            <ChartsReferenceLine
              y={30}
              label="F, L目標 (30%)"
              lineStyle={{ stroke: '#ff9800', strokeDasharray: '5 5' }}
              labelStyle={{ fill: '#ff9800' }}
            />
          </LineChart>
        </Box>
      </CardContent>
    </Card>
  );
}