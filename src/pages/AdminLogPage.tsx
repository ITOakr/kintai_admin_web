import { Box, Typography, Card, CardContent } from "@mui/material"
import AdminLogsTable from "../components/AdminLogsTable";

export default function AdminLogPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Card elevation={6}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            操作ログ
          </Typography>
          <AdminLogsTable />
        </CardContent>
      </Card>
    </Box>
  );
}