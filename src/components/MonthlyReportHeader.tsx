import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// このコンポーネントが受け取るPropsの型定義
interface MonthlyReportHeaderProps {
  year: number;
  month: number;
  loading: boolean;
  err: string | null;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function MonthlyReportHeader({
  year,
  month,
  loading,
  err,
  onYearChange,
  onMonthChange,
  onPrevYear,
  onNextYear,
  onPrevMonth,
  onNextMonth
}: MonthlyReportHeaderProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 55 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                月次レポート
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={onPrevYear}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus':{ outline: 'none' } }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <FormControl sx={{ minWidth: 100 }} size="medium">
                {/* <InputLabel id="year-label">年</InputLabel> */}
                <InputLabel>年</InputLabel>
                <Select
                  value={year}
                  label="年"
                  onChange={(e) => onYearChange(Number(e.target.value))}
                >
                  {yearOptions.map(y => (
                    <MenuItem key={y} value={y}>{y}年</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                onClick={onNextYear}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus': { outline: 'none' } }}
              >
                <ChevronRightIcon />
              </IconButton>

              <IconButton
                onClick={onPrevMonth}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus': { outline: 'none' } }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <FormControl sx={{ minWidth: 80 }} size="medium">
                {/* <InputLabel id="month-label">月</InputLabel> */}
                <InputLabel>月</InputLabel>
                <Select
                  value={month}
                  label="月"
                  onChange={(e) => onMonthChange(Number(e.target.value))}
                >
                  {monthOptions.map(m => (
                    <MenuItem key={m} value={m}>{m}月</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                onClick={onNextMonth}
                size="large"
                color="primary"
                disabled={loading}
                sx={{ '&:focus': { outline: 'none' } }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
          
          {err && (
            <Box sx={{ mt: 2 }}>
              <Chip label={err} color="error" variant="outlined" />
            </Box>
          )}
        </CardContent>
      </Card>
  );
}
