import {
  Box,
  Typography,
  Stack,
  TextField,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";

interface SalesInputFormProps {
  sales: number | null;
  note: string;
  onSalesChange: (newSales: number | null) => void;
  onNoteChange: (newNote: string) => void;
  onEdit: () => void;
}

export default function SalesInputForm({
  sales,
  note,
  onSalesChange,
  onNoteChange,
  onEdit,
}: SalesInputFormProps) {
  const handleSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 全角数字を半角数字に変換し、数字以外を除去
    const normalized = e.target.value
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[^0-9]/g, '');

    const newValue = normalized === "" ? null : Number(normalized);
    onSalesChange(newValue); // 親コンポーネントに変更を通知
    onEdit(); // 編集されたことを通知
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNoteChange(e.target.value); // 親コンポーネントに変更を通知
    onEdit(); // 編集されたことを通知
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PaidIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          売上入力
        </Typography>
      </Box>
      <Stack spacing={2}>
        <TextField
          label="金額（円）"
          type="text"
          value={sales ?? ""}
          onChange={handleSalesChange}
          fullWidth
          slotProps={{
            input: {
              inputMode: "numeric"
            }
          }}
        />
        <TextField
          label="メモ（任意）"
          value={note}
          onChange={handleNoteChange}
          multiline
          rows={3}
          fullWidth
        />
      </Stack>
    </>
  );
}