import { Box, Card, CardContent, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { LineChart, ChartsReferenceLine } from '@mui/x-charts';
import { MonthlySummaryResponse } from '../lib/api';
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const chartRef = useRef<HTMLDivElement>(null);

  const [visibleSeries, setVisibleSeries] = useState({
    fRatio: true,
    lRatio: true,
    flRatio: true,
    cumulativeFLRatio: true,
  });


  const seriesData = useMemo(() => {
    if (!data || !data.days || data.days.length === 0) {
      return { xAxisData: [], series: [], yAxisMax: 100, dayOfWeekData: [] };
    }

    const xAxisData = data.days.map(day => new Date(day.date).getDate());
    const dayOfWeekData = data.days.map(day => new Date(day.date).getDay()); // 0: Sunday, 1: Monday, ..., 6: Saturday
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

    return { xAxisData, series, yAxisMax, dayOfWeekData };
  }, [data, visibleSeries]); // dataかvisibleSeriesが変わった時だけ再計算

  const handleSeriesToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVisibleSeries({
      ...visibleSeries,
      [event.target.name]: event.target.checked,
    });
  };

  // DOMが更新された後に軸ラベルの色を設定
  useEffect(() => {
    if (!chartRef.current || !data?.days) return;

    const updateAxisLabelColors = () => {
      // 複数のセレクターを試す
      let tickLabels = chartRef.current?.querySelectorAll('.MuiChartsAxis-bottom .MuiChartsAxis-tickLabel');
      
      if (!tickLabels || tickLabels.length === 0) {
        tickLabels = chartRef.current?.querySelectorAll('.MuiChartsAxis-tickLabel');
      }
      
      if (!tickLabels || tickLabels.length === 0) {
        tickLabels = chartRef.current?.querySelectorAll('text');
      }

      if (!tickLabels) return;

      // すでに色が設定済みかどうかをチェック
      let colorAlreadySet = false;

      tickLabels.forEach((label, index) => {
        const textContent = (label as SVGTextElement).textContent;
        
        // X軸のラベル（数字＋"日"）かどうかを判定
        if (textContent && textContent.includes('日') && index < seriesData.dayOfWeekData.length) {
          const currentFill = (label as SVGTextElement).getAttribute('fill');
          const dayOfWeek = seriesData.dayOfWeekData[index];
          
          // 実際の日付を取得してデバッグ
          const dayNumber = parseInt(textContent.replace('日', ''));
          const actualDate = data?.days?.find(d => new Date(d.date).getDate() === dayNumber);
          const actualDayOfWeek = actualDate ? new Date(actualDate.date).getDay() : null;
          
          
          let targetColor = '#000000'; // 平日は黒色
          if (actualDayOfWeek === 0) { // Sunday
            targetColor = '#ef5350'; // 赤色
          } else if (actualDayOfWeek === 6) { // Saturday
            targetColor = '#1976d2'; // 青色
          }
          
          // 色が既に正しく設定されている場合はスキップ
          if (currentFill !== targetColor) {
            // 複数の方法でスタイルを適用して確実に色を変更
            (label as SVGTextElement).setAttribute('fill', targetColor);
            (label as SVGTextElement).style.setProperty('fill', targetColor, 'important');
            (label as SVGTextElement).style.setProperty('color', targetColor, 'important');
            (label as SVGTextElement).style.setProperty('--weekend-color', targetColor);
            
            // SVG専用の属性も設定
            (label as SVGTextElement).setAttribute('style', `fill: ${targetColor} !important; color: ${targetColor} !important;`);
            
            // クラス名も追加
            (label as SVGTextElement).classList.add('custom-weekend-color');
            (label as SVGTextElement).setAttribute('data-weekend-color', targetColor);
            
            console.log(`Set ${textContent} to ${targetColor} - fill attr: ${(label as SVGTextElement).getAttribute('fill')}`);
          } else {
            colorAlreadySet = true;
          }
        }
      });

      return colorAlreadySet;
    };

    let intervalId: number | null = null;
    
    // 初回実行
    const initialResult = updateAxisLabelColors();
    
    // 色が設定されていない場合のみ定期実行
    if (!initialResult) {
      intervalId = setInterval(() => {
        const result = updateAxisLabelColors();
        if (result && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 100);
      
      // 5秒後に停止
      setTimeout(() => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [data, seriesData.dayOfWeekData, visibleSeries]);

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
        <Box ref={chartRef} sx={{ width: '100%' }}>
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
            sx={{
              '& .MuiLineElement-root': { cursor: 'pointer' },
              // カスタム週末色のクラスに最優先でスタイルを適用
              '& .custom-weekend-color': {
                fill: 'var(--weekend-color) !important',
                color: 'var(--weekend-color) !important'
              },
              // data属性を使った強制適用
              '& text[data-weekend-color="#ef5350"]': {
                fill: '#ef5350 !important',
                color: '#ef5350 !important'
              },
              '& text[data-weekend-color="#1976d2"]': {
                fill: '#1976d2 !important', 
                color: '#1976d2 !important'
              },
              // より具体的なセレクター
              '& svg text': {
                '&[data-weekend-color]': {
                  fill: 'var(--weekend-color) !important'
                }
              }
            }}
            onAxisClick={(_, axisData) => { // ★ onItemClickの代わりにonAxisClickを使用
              if (axisData && axisData.axisValue !== null && data?.days) {
                // axisValueはクリックされたX軸の値（日付の数値）
                const clickedDay = axisData.axisValue as number;
                // 日付の数値から、対応する日付文字列を探す
                const targetDayData = data.days.find(day => new Date(day.date).getDate() === clickedDay);
                if (targetDayData) {
                  navigate(`/?date=${targetDayData.date}`);
                  window.scrollTo(0, 0); // 画面のトップにスクロール
                }
              }
            }}
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