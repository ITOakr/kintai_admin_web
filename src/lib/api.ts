const BASE = import.meta.env.VITE_API_BASE_URL as string;

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * APIリクエストを送信するための共通ラッパー関数
 * @param path リクエスト先のパス (例: "/users")
 * @param options fetch APIに渡すオプション
 */
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = { ...authHeader(), ...(options.headers || {}) };
  const response = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `API response failed: ${response.status}`;
    try {
      const resBody = await response.json();
      errorMsg = resBody?.error ?? resBody?.errors?.join(", ") ?? errorMsg;
    } catch (e) {
      // JSONパースに失敗した場合はステータスコードを含むデフォルトのエラーメッセージを使用
    }
    throw new Error(errorMsg);
  }
  return response.json() as Promise<T>;
}

// 認証関連
export async function login(email: string, password: string) {
  interface AuthResponse { token: string; user: { id: number; name: string; email: string } };
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth: { email, password } }),
  });
}

export async function me() {
  interface Me { id:number; email:string; name:string; role?: "employee"|"admin" };
  return apiRequest<Me>("/auth/me");
}

// ユーザー管理関連
export async function getPendingUsers() {
  interface PendingUser { id: number; email: string; name: string; created_at: string };
  return apiRequest<PendingUser[]>("/users/pending");
}

export async function approveUser(userId: number, role: "employee" | "admin", base_hourly_wage: number) {
  const body = new URLSearchParams({ role: role, base_hourly_wage: String(base_hourly_wage) });
  return apiRequest<{ message: string }>(`/users/${userId}/approve`, {
    method: "POST",
    headers: { "Content-interface": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
}

export async function getUsers() {
  interface ActiveUser { id:number; email:string; name:string; role:"employee"|"admin"; base_hourly_wage:number; created_at:string; }
  return apiRequest<ActiveUser[]>("/users");
}

export async function updateUser(userId: number, role: "employee" | "admin", base_hourly_wage: number) {
  const body = new URLSearchParams({ role: role, base_hourly_wage: String(base_hourly_wage) });
  return apiRequest<{ message: string }>(`/users/${userId}`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
}

export async function deleteUser(userId: number) {
  return apiRequest<{ message: string }>(`/users/${userId}`, {
    method: "DELETE",
  });
}

// 勤怠関連
export async function getEntries(userId: number, date: string) {
  interface Entry { id:number; user_id:number; kind:string; happened_at:string; source:string; };
  return apiRequest<Entry[]>(`/v1/attendance/entries?user_id=${userId}&date=${date}`);
}

export async function getDaily(userId: number, date: string) {
  interface DailyAttendance {
    date:string; actual:{start:string|null,end:string|null};
    totals:{work:number,break:number,overtime:number,night:number,holiday:number};
    status:"open"|"closed"|"not_started"|"inconsistent_data";
  };
  return apiRequest<DailyAttendance>(`/v1/attendance/my/daily?user_id=${userId}&date=${date}`);
}

// 売上・食材費関連
interface Sales { id?: number; date: string; amount_yen: number | null; note: string | null };

export async function getSales(date: string) {
  return apiRequest<Sales>(`/v1/sales?date=${date}`);
}

export async function putSales(date: string, amount_yen: number, note?: string) {
  const body = new URLSearchParams({ amount_yen: String(amount_yen) });
  if (note) body.set("note", note);
  return apiRequest<Sales>(`/v1/sales?date=${date}`, {
    method: "PUT",
    headers: { ...authHeader(), "Content-interface": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
}

export interface FoodCostItem { id?: number; category: string; amount_yen: number; note: string | null; };

export async function getFoodCosts(date: string) {
  return apiRequest<FoodCostItem[]>(`/v1/food_costs?date=${date}`);
}

export async function putFoodCosts(date: string, foodCostItems: FoodCostItem[]) {
  const body = new URLSearchParams();
  foodCostItems.forEach(item => {
    if (item.amount_yen > 0) {
      if (item.id) {
        body.append(`food_costs[][id]`, String(item.id));
      }
    }
    body.append(`food_costs[][category]`, item.category);
    body.append(`food_costs[][amount_yen]`, String(item.amount_yen));
    if (item.note) {
      body.append(`food_costs[][note]`, item.note);
    }
  });
  return apiRequest<FoodCostItem[]>(`/v1/food_costs?date=${date}`, {
    method: "PUT",
    headers: { ...authHeader(), "Content-interface": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
}

// 日報データの型定義
export interface DailyReport {
  id?: number;
  date: string;
  content: string | null;
}

// 日報を取得するAPI関数
export async function getDailyReport(date: string) {
  return apiRequest<DailyReport>(`/v1/daily_report?date=${date}`);
}

// 日報を保存（作成/更新）するAPI関数
export async function putDailyReport(date: string, content: string) {
  const body = new URLSearchParams({ content });
  return apiRequest<DailyReport>(`/v1/daily_report?date=${date}`, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
}

export async function putDailyFixedCosts(date: string, employeeCount: number) {
  const body = new URLSearchParams({ full_time_employee_count: String(employeeCount) });
  return apiRequest<any>(`/v1/daily_fixed_costs?date=${date}`, {
    method: "PUT",
    headers: { ...authHeader(), "Content-interface": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
}

// DailySummary APIのレスポンスの型定義
export interface DailySummary {
  date: string;
  sales: number | null;
  sales_note: string | null;
  part_time_wage: number;
  fixed_wage: number;
  total_wage: number;
  wage_rows: Array<{
    user_id: number;
    user_name: string;
    base_hourly_wage: number;
    work_minutes: number;
    break_minutes: number;
    night_minutes: number;
    daily_wage: number;
  }>;
  food_costs_total: number;
  full_time_employee_count: number;
  l_ratio: number | null;
  f_ratio: number | null;
  f_l_ratio: number | null;
}
// 日次サマリの取得
export async function getDailySummary(date: string) {
  return apiRequest<DailySummary>(`/v1/daily_summary?date=${date}`);
}

// 月次サマリーAPIのレスポンスの型定義
export interface MonthlySummaryResponse {
  year: number;
  month: number;
  days: Array<{
    date: string;
    daily_sales: number | null;
    total_daily_wage: number;
    daily_food_costs: number;
    l_ratio: number | null;
    f_ratio: number | null;
    f_l_ratio: number | null;
    cumulative_f_l_ratio: number | null;
    last_year_cumulative_f_l_ratio: number | null;
  }>;
  monthly_sales: number;
  monthly_wage: number;
  monthly_food_costs: number;
  monthly_l_ratio: number | null;
  monthly_f_ratio: number | null;
  monthly_f_l_ratio: number | null;
}

// 新しい月次サマリーAPIを呼び出す関数
export async function getMonthlySummary(year: number, month: number) {
  return apiRequest<MonthlySummaryResponse>(`/v1/monthly_summary?year=${year}&month=${month}`);
}

// 操作ログ,通知関連
// 操作ログの型定義
export interface AdminLog {
  id: number;
  created_at: string;
  admin_user_name: string;
  target_user_name: string | null;
  action: string;
  details: string;
}

// APIからのレスポンス全体の型定義
export interface AdminLogResponse {
  logs: AdminLog[];
  total_count: number;
  page: number;
  per_page: number;
}

// 操作ログを取得するAPI関数
export async function getAdminLogs(page: number, perPage: number) {
  return apiRequest<AdminLogResponse>(`/v1/admin_logs?page=${page}&per_page=${perPage}`);
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  notifiable_interface: 'user_approval_request' | 'f_l_ratio_warning';
  link_to: string;
  created_at: string;
}

export async function getNotifications() {
  return apiRequest<Notification[]>(`/v1/notifications`);
}

export async function markNotificationAsRead(id: number) {
  return apiRequest<Notification>(`/v1/notifications/${id}`, {
    method: "PATCH",
  });
}