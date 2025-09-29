// すでにログイン・adminチェックを通過している前提のメイン領域を差し替え
import {  useState } from "react";
import {
  Typography, Button,
  Stack, Box, Popover,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale/ja";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FiberManualRecord as FiberManualRecordIcon,
} from "@mui/icons-material";

interface DateNavigatorProps {
  date: string; // "YYYY-MM-DD"
  onDateChange: (newDate: string) => void; // 日付が変更されたときに呼ばれる関数
}

export default function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const calendarOpen = Boolean(anchorEl);

  const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }

  const handleCalendarClose = () => {
    setAnchorEl(null);
  }

  const handleCalendarChange = (newDate: Date | null ) => {
    if (newDate) {
      onDateChange(newDate.toISOString().slice(0,10));
      handleCalendarClose();
    }
  }

  const handlePrevDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate.toISOString().slice(0,10));
  }

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate.toISOString().slice(0,10));
  }

  const handleToday = () => {
    const today = new Date();
    onDateChange(today.toISOString().slice(0,10));
  }

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0,0,0,0); // 時分秒をリセットして日付だけ比較
  selectedDate.setHours(0,0,0,0);

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const dateString = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 (${weekDays[selectedDate.getDay()]})`;

  return (
    <>
      <Stack direction="column" spacing={1} alignItems="center">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            mb: 2,
            height: '42px'
          }}
        >
          <Button
            onClick={handlePrevDay}
            sx={{
              bgcolor: '#f8f9fa',
              border: 1,
              borderColor: 'divider',
              borderRadius: '4px 0 0 4px',
              borderRight: 0,
              minWidth: '50px',
              '&:hover': { bgcolor: '#e9ecef' },
              '&:focus': { outline: 'none' }
            }}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            onClick={handleToday}
            sx={{
              bgcolor: '#f8f9fa',
              border: 1,
              borderColor: 'divider',
              borderRadius: '4px',
              minWidth: '50px',
              '&:hover': { bgcolor: '#e9ecef' },
              '&:focus': { outline: 'none' }
            }}
          >
            <FiberManualRecordIcon sx={{ fontSize: 12, color: '#1976d2' }} />
          </Button>
           <Box
            onClick={handleDateClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f8f9fa',
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'divider',
              px: 3,
              minWidth: '300px',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#e9ecef' },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '40px' }}>
              <Typography>{dateString}</Typography>
              {selectedDate.getTime() === today.getTime() && (
                <Typography
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    ml: 1
                  }}
                >
                  本日
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            onClick={handleNextDay}
            sx={{
              bgcolor: '#f8f9fa',
              border: 1,
              borderColor: 'divider',
              borderRadius: '0 4px 4px 0',
              borderLeft: 0,
              minWidth: '50px',
              '&:hover': { bgcolor: '#e9ecef' },
              '&:focus': { outline: 'none' }
            }}
          >
            <ChevronRightIcon />
          </Button>
        </Box>
      </Stack>
      <Popover
        open={calendarOpen}
        anchorEl={anchorEl}
        onClose={handleCalendarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ mt: 1 }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <DateCalendar
            value={new Date(date)}
            onChange={handleCalendarChange}
            sx={{ bgcolor: 'background.paper' }}
          />
        </LocalizationProvider>
      </Popover>
    </>
  );
}