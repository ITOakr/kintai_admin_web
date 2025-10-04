import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import LocalPizzaIcon from "@mui/icons-material/LocalPizza";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { FoodCostItem } from "../lib/api";
import { formatYen } from "../utils/formatters";

// 食材費のカテゴリを定義
const FOOD_CATEGORIES = {
  meat: "肉類",
  ingredient: "食材",
  drink: "ドリンク",
  other: "その他"
};

// このコンポーネントが受け取るPropsの型を定義
interface FoodCostFormProps {
  items: FoodCostItem[];
  onItemsChange: (newItems: FoodCostItem[]) => void;
  onEdit: () => void;
}

export default function FoodCostForm({ items, onItemsChange, onEdit }: FoodCostFormProps) {

  // 特定の項目が変更されたときの処理
  const handleItemChange = (index: number, field: keyof FoodCostItem, value: string | number) => {
    // 現在のitems配列のコピーを作成
    const newItems = [...items];
    let processedValue = value;

    if (field === "amount_yen") {
      // 全角数字を半角数字に変換し、数字以外を除去
      const normalized = String(value)
        .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/[^0-9]/g, '');
      processedValue = normalized === "" ? 0 : Number(normalized);
    }

    // 特定の項目の、特定のフィールドを新しい値で更新
    switch (field) {
      case "category":
        newItems[index].category = processedValue as FoodCostItem["category"];
        break;
      case "amount_yen":
        newItems[index].amount_yen = processedValue as FoodCostItem["amount_yen"];
        break;
      case "note":
        newItems[index].note = processedValue as FoodCostItem["note"];
        break;
      default:
        // Should never happen due to keyof FoodCostItem, but for safety:
        throw new Error(`Unknown field: ${field}`);
    }

    // 親コンポーネントに変更後の配列全体を通知
    onItemsChange(newItems);
    onEdit();
  };

  // 新しい項目を追加する処理
  const handleAddItem = () => {
    const newItems = [...items, { category: "meat", amount_yen: 0, note: "" }];
    onItemsChange(newItems);
    onEdit();
  };

  // 項目を削除する処理
  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
    onEdit();
  };

  // 合計金額を計算
  const totalFoodCosts = items.reduce((sum, item) => sum + item.amount_yen, 0);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocalPizzaIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          食材費入力
        </Typography>
      </Box>

      <Stack spacing={2}>
        {items.map((item, index) => (
          <Box key={index} sx={{ border: '1px solid #e0e0e0', p: 1.5, borderRadius: 1 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>カテゴリ</InputLabel>
                  <Select
                    value={item.category}
                    label="カテゴリ"
                    onChange={(e) => handleItemChange(index, "category", e.target.value)}
                  >
                    {Object.entries(FOOD_CATEGORIES).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="金額（円）"
                  type="text"
                  size="small"
                  value={item.amount_yen}
                  onChange={(e) => {
                    handleItemChange(index, "amount_yen", e.target.value);
                  }}
                  sx={{ flex: 1 }}
                  slotProps={{
                    input: {
                      inputMode: "numeric"
                    }
                  }}
                />
                <IconButton
                  onClick={() => handleRemoveItem(index)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
              <TextField
                label="メモ（任意）"
                size="small"
                value={item.note ?? ""}
                onChange={(e) => handleItemChange(index, "note", e.target.value)}
                fullWidth
              />
            </Stack>
          </Box>
        ))}
        <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddItem}>
          項目を追加
        </Button>
        <Typography align="right" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          合計: {formatYen(totalFoodCosts)}
        </Typography>
      </Stack>
    </>
  );
}