
import { DailySummary } from "../lib/api.ts";
import {
  Typography, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableFooter,
  Box, InputAdornment
} from "@mui/material";
import { formatYen, minutesToHM } from "../utils/formatters";


interface WageTableProps {
  dailySummary: DailySummary | null;
  employeeCount: number;
  onEmployeeCountChange: (count: number) => void;
  onEdit: () => void; // 編集されたことを親に伝えるための関数
}


export default function WageTable({
  dailySummary,
  employeeCount,
  onEmployeeCountChange,
  onEdit,
}: WageTableProps) {
  return (
    <Table size="small" sx={{
      '& th': {
        fontWeight: 'bold',
        backgroundColor: '#f8f9fa',
        fontSize: '1.1rem'
      },
      '& td': {
        fontSize: '1.1rem'
      },
      '& th, & td': {
        border: 1,
        borderColor: 'divider',
        padding: '12px' // より大きなフォントに合わせてパディングも調整
      }
    }}>
      <TableHead>
        <TableRow>
          <TableCell>名前</TableCell>
          <TableCell align="right">実働</TableCell>
          <TableCell align="right">休憩</TableCell>
          <TableCell align="right">深夜</TableCell>
          <TableCell align="right">基本時給</TableCell>
          <TableCell align="right" sx={{ backgroundColor: '#f8f9fa' }}>日額人件費</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {dailySummary?.wage_rows.map((r) => (
          <TableRow key={r.user_id} hover>
            <TableCell>{r.user_name}</TableCell>
            <TableCell align="right">{minutesToHM(r.work_minutes)}</TableCell>
            <TableCell align="right">{minutesToHM(r.break_minutes)}</TableCell>
            <TableCell align="right">{minutesToHM(r.night_minutes)}</TableCell>
            <TableCell align="right">{formatYen(r.base_hourly_wage)}</TableCell>
            <TableCell align="right"><b>{formatYen(r.daily_wage)}</b></TableCell>
          </TableRow>
        ))}
        {(!dailySummary || dailySummary.wage_rows.length === 0) && (
          <TableRow>
            <TableCell colSpan={6} align="center" sx={{ color: "text.secondary" }}>
              当日の勤務データがありません
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      <TableFooter>
        {/* アルバイト合計行 */}
        <TableRow>
          <TableCell colSpan={5} align="right" sx={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: 0 }}>
            アルバイト合計
          </TableCell>
          <TableCell align="right" sx={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: 0 }}>
            {formatYen(dailySummary?.part_time_wage ?? 0)}
          </TableCell>
        </TableRow>

        {/* 社員の人件費計算行 */}
        <TableRow>
          <TableCell colSpan={5} align="right" sx={{ verticalAlign: 'middle', borderBottom: 0, padding: '8px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
              <Typography variant="body1" component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                社員数
              </Typography>
              <TextField
                type="number"
                size="small"
                value={employeeCount}
                onChange={(e) => {
                  onEmployeeCountChange(Number(e.target.value) || 0);
                  onEdit();
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">人</InputAdornment>,
                  inputProps: { min: 0, style: { height: '25px', textAlign: 'left' }, autoComplete: 'off' }
                }}
                sx={{
                  width: '100px',
                }}
              />
              <Typography variant="body2" component="span">
                × 10,800円 =
              </Typography>
            </Box>
          </TableCell>
          <TableCell align="right" sx={{ fontSize: '1.2rem', fontWeight: 'bold', verticalAlign: 'middle', borderBottom: 0, padding: '8px' }}>
            {formatYen(dailySummary?.fixed_wage ?? 0)}
          </TableCell>
        </TableRow>

        {/* 総合計行 */}
        <TableRow sx={{ backgroundColor: '#f0f7ff' }}>
          <TableCell colSpan={5} align="right" sx={{ border: 0, borderTop: '2px solid', borderColor: 'divider', padding: '12px' }}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>合計</Typography>
          </TableCell>
          <TableCell align="right" sx={{ border: 0, borderTop: '2px solid', borderColor: 'divider', padding: '12px' }}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
              {formatYen(dailySummary?.total_wage ?? 0)}
            </Typography>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}