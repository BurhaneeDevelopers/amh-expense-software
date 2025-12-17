// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager';
  branchId: string | null;
  createdAt: string;
  _id?: string;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

// Branch Types
export interface Branch {
  id: string;
  name: string;
  city: string;
  location: string;
  createdAt: string;
  _id?: string;
}

// Transaction Types
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'gpay' | 'bank_transfer';
export type ExpenseCategory = 'Rent' | 'Utilities' | 'Salaries' | 'Supplies' | 'Maintenance' | 'Transportation' | 'Marketing' | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod | null;
  category: ExpenseCategory | null;
  note: string;
  date: string;
  userId: string;
  branchId: string;
  createdAt: string;
  _id?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: UserWithoutPassword;
}

export interface BranchesResponse {
  branches: Branch[];
}

export interface UsersResponse {
  users: UserWithoutPassword[];
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface TransactionResponse {
  transaction: Transaction;
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByMethod: Record<string, number>;
  expenseByCategory: Record<string, number>;
  dailyData: DailyData[];
}

export interface DailyData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

// Component Props Types
export interface DashboardTabProps {
  currentUser: UserWithoutPassword;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export interface ReportsTabProps {
  currentUser: UserWithoutPassword;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

export interface AdminPanelProps {
  currentUser: UserWithoutPassword;
}

export interface AddTransactionDialogProps {
  currentUser: UserWithoutPassword;
  branches: Branch[];
  selectedDate: string;
}

export interface TransactionsTableProps {
  transactions: Transaction[];
}

export interface AddBranchDialogProps {}

export interface AddUserDialogProps {
  branches: Branch[];
}

export interface LoginScreenProps {
  onLogin: (user: UserWithoutPassword) => void;
}
