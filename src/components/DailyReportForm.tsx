import {
  Box,
  Typography,
  TextField,
} from "@mui/material";
import CreateIcon from '@mui/icons-material/Create';

// このコンポーネントが受け取るProps(引数)の型を定義します
interface DailyReportFormProps {
  report: string;
  onReportChange: (newReport: string) => void;
  onEdit: () => void;
}

export default function DailyReportForm({ report, onReportChange, onEdit }: DailyReportFormProps) {

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onReportChange(e.target.value); // 親コンポーネントに変更を通知
    onEdit(); // 編集されたことを通知
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CreateIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          日報
        </Typography>
      </Box>
      <TextField
        label="本日のまとめを記入"
        multiline
        rows={5}
        fullWidth
        variant="outlined"
        value={report}
        onChange={handleReportChange}
      />
    </>
  );
}