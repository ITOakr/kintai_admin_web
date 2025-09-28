/**
 * 数値を日本円の通貨形式（例: "1,234 円"）にフォーマットします。
 * @param amount - フォーマットする数値。nullやundefinedも許容します。
 * @returns フォーマットされた文字列。入力がnullやundefinedの場合は"-"を返します。
 */
export function formatYen(amount: number | null | undefined): string {
  if (amount == null) {
    return "-";
  }
  return amount.toLocaleString("ja-JP") + " 円";
}

/**
 * 分を「X時間Y分」の形式にフォーマットします。
 * @param totalMinutes - フォーマットする分数。
 * @returns フォーマットされた文字列。
 */
export function minutesToHM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
}

/**
 * ISO 8601形式の日時文字列を、日本のロケールに合わせた読みやすい形式（例: "2025/09/29 10:30"）にフォーマットします。
 * @param isoString - フォーマットする日時文字列。nullも許容します。
 * @returns フォーマットされた文字列。入力がnullの場合は"-"を返します。
 */
export function formatDateTime(isoString: string | null): string {
  if (!isoString) {
    return "-";
  }
  return new Date(isoString).toLocaleString("ja-JP", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
}

/**
 * 数値をパーセンテージ形式（例: "12.34 %"）にフォーマットします。
 * @param value - フォーマットする数値（例: 0.1234）。nullやundefinedも許容します。
 * @returns フォーマットされた文字列（小数点以下2桁まで）。入力がnullやundefinedの場合は"-"を返します。
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value == null) {
    return "-";
  }
  return (value * 100).toFixed(2) + " %";
}