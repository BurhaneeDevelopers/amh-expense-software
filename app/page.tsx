'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Building2, Users, TrendingUp, TrendingDown, Wallet, Calendar, Plus, LogOut, BarChart3, Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type {
  UserWithoutPassword,
  Branch,
  Transaction,
  PaymentMethod,
  ExpenseCategory,
  BranchesResponse,
  TransactionsResponse,
  AnalyticsData,
  UsersResponse,
  LoginResponse,
  TransactionResponse,
  DashboardTabProps,
  ReportsTabProps,
  AdminPanelProps,
  AddTransactionDialogProps,
  TransactionsTableProps,
  AddUserDialogProps,
  LoginScreenProps,
} from '@/types';

const queryClient = new QueryClient();

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'gpay', 'bank_transfer'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Transportation', 'Marketing', 'Other'];

function ExpenseTrackerApp() {
  const [currentUser, setCurrentUser] = useState<UserWithoutPassword | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = (user: UserWithoutPassword) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Expense Tracker</h1>
              <p className="text-sm text-slate-500">Multi-Branch Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
              <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {currentUser.role}
              </Badge>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            {currentUser.role === 'admin' && (
              <TabsTrigger value="admin" className="gap-2">
                <Users className="h-4 w-4" />
                Admin Panel
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab 
              currentUser={currentUser} 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab 
              currentUser={currentUser}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </TabsContent>

          {currentUser.role === 'admin' && (
            <TabsContent value="admin">
              <AdminPanel currentUser={currentUser} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/initialize');
      const data = await response.json();
      toast({
        title: 'System Initialized',
        description: 'Default admin and branches created',
      });
      console.log('Login credentials:', data.credentials);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLogin(data.user);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.name}`,
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl w-fit mb-2">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Expense Tracker</CardTitle>
          <CardDescription>Sign in to manage your branch expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleInitialize}
              disabled={isInitializing}
            >
              {isInitializing ? 'Initializing...' : 'Initialize System (First Time Setup)'}
            </Button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Click above to create default admin and branches
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardTab({ currentUser, selectedDate, setSelectedDate }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch branches
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches');
      return response.json();
    },
  });

  const branches = branchesData?.branches || [];

  // Fetch transactions for selected date and branch
  const selectedBranchId = currentUser.role === 'manager' ? currentUser.branchId : null;
  
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', selectedDate, selectedBranchId],
    queryFn: async () => {
      let url = `/api/transactions?startDate=${selectedDate}&endDate=${selectedDate}`;
      if (selectedBranchId) {
        url += `&branchId=${selectedBranchId}`;
      }
      const response = await fetch(url);
      return response.json();
    },
  });

  const transactions = transactionsData?.transactions || [];

  // Calculate daily totals
  const dailyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const dailyExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const dailyBalance = dailyIncome - dailyExpense;

  // Group transactions by branch (for admin view)
  const transactionsByBranch = transactions.reduce((acc, t) => {
    if (!acc[t.branchId]) {
      acc[t.branchId] = [];
    }
    acc[t.branchId].push(t);
    return acc;
  }, {});

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? `${branch.name} (${branch.city})` : 'Unknown Branch';
  };

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">₹{dailyIncome.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Daily Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">₹{dailyExpense.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${dailyBalance >= 0 ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white' : 'border-orange-300 bg-gradient-to-br from-orange-50 to-white'}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${dailyBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              <Wallet className="h-4 w-4" />
              Daily Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${dailyBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              ₹{dailyBalance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Button */}
      <div className="flex justify-end">
        <AddTransactionDialog currentUser={currentUser} branches={branches} selectedDate={selectedDate} />
      </div>

      {/* Transactions List */}
      {currentUser.role === 'admin' ? (
        // Admin view: Show by branch
        <div className="space-y-6">
          {branches.map(branch => {
            const branchTransactions = transactionsByBranch[branch.id] || [];
            const branchIncome = branchTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            const branchExpense = branchTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);
            const branchBalance = branchIncome - branchExpense;

            return (
              <Card key={branch.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        {branch.name}
                      </CardTitle>
                      <CardDescription>{branch.city} - {branch.location}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Balance</p>
                      <p className={`text-2xl font-bold ${branchBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ₹{branchBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {branchTransactions.length > 0 ? (
                    <TransactionsTable transactions={branchTransactions} />
                  ) : (
                    <p className="text-center text-slate-500 py-8">No transactions for this date</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Manager view: Show own branch only
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(new Date(selectedDate), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-slate-500 py-8">Loading...</p>
            ) : transactions.length > 0 ? (
              <TransactionsTable transactions={transactions} />
            ) : (
              <p className="text-center text-slate-500 py-8">No transactions for this date</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TransactionsTable({ transactions }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method/Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">
                ₹{transaction.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                {transaction.type === 'income' ? transaction.method : transaction.category}
              </TableCell>
              <TableCell className="text-slate-600">{transaction.note || '-'}</TableCell>
              <TableCell className="text-slate-500 text-sm">
                {new Date(transaction.createdAt).toLocaleTimeString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AddTransactionDialog({ currentUser, branches, selectedDate }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [branchId, setBranchId] = useState(currentUser.branchId || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setAmount('');
    setMethod('cash');
    setCategory('Other');
    setNote('');
    setType('income');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      type,
      amount: parseFloat(amount),
      method: type === 'income' ? method : null,
      category: type === 'expense' ? category : null,
      note,
      date: selectedDate,
      userId: currentUser.id,
      branchId: currentUser.role === 'manager' ? currentUser.branchId : branchId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record income or expense for {selectedDate}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentUser.role === 'admin' && (
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} ({branch.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {type === 'income' ? (
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>
                      {m.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Note (Optional)</Label>
            <Textarea
              placeholder="Add any additional details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Transaction'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportsTab({ currentUser, startDate, endDate, setStartDate, setEndDate }) {
  const [selectedBranchId, setSelectedBranchId] = useState(currentUser.branchId || 'all');

  // Fetch branches
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches');
      return response.json();
    },
  });

  const branches = branchesData?.branches || [];

  // Fetch analytics
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', startDate, endDate, selectedBranchId],
    queryFn: async () => {
      let url = `/api/analytics?startDate=${startDate}&endDate=${endDate}`;
      if (selectedBranchId !== 'all') {
        url += `&branchId=${selectedBranchId}`;
      }
      const response = await fetch(url);
      return response.json();
    },
  });

  const analytics = analyticsData || {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeByMethod: {},
    expenseByCategory: {},
    dailyData: [],
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {currentUser.role === 'admin' && (
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-slate-500">Loading analytics...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-700">₹{analytics.totalIncome.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700">Total Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-700">₹{analytics.totalExpense.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${analytics.balance >= 0 ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white' : 'border-orange-300 bg-gradient-to-br from-orange-50 to-white'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-medium ${analytics.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  Net Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${analytics.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  ₹{analytics.balance.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income by Method */}
          <Card>
            <CardHeader>
              <CardTitle>Income by Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.incomeByMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                    <span className="text-lg font-bold text-green-700">₹{amount.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(analytics.incomeByMethod).length === 0 && (
                  <p className="text-center text-slate-500 py-4">No income data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Expense by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.expenseByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="font-medium">{category}</span>
                      <span className="text-lg font-bold text-red-700">₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
                {Object.keys(analytics.expenseByCategory).length === 0 && (
                  <p className="text-center text-slate-500 py-4">No expense data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Daily Data */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expense</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.dailyData.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {format(new Date(day.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right text-green-700 font-semibold">
                          ₹{day.income.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-700 font-semibold">
                          ₹{day.expense.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${day.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                          ₹{day.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {analytics.dailyData.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No data available for selected period</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AdminPanel({ currentUser }) {
  const [activeTab, setActiveTab] = useState('branches');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Management Panel</CardTitle>
          <CardDescription>Manage branches and users</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <BranchesManagement />
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BranchesManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches');
      return response.json();
    },
  });

  const branches = branchesData?.branches || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Branches</CardTitle>
          <AddBranchDialog />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {branches.map(branch => (
            <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-slate-50">
              <div>
                <p className="font-semibold text-lg">{branch.name}</p>
                <p className="text-sm text-slate-600">{branch.city} - {branch.location}</p>
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <p className="text-center text-slate-500 py-8">No branches yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddBranchDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create branch');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({ title: 'Success', description: 'Branch created successfully' });
      setOpen(false);
      setName('');
      setCity('');
      setLocation('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ name, city, location }); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Branch Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Branch'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UsersManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      return response.json();
    },
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches');
      return response.json();
    },
  });

  const users = usersData?.users || [];
  const branches = branchesData?.branches || [];

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? `${branch.name} (${branch.city})` : 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Users</CardTitle>
          <AddUserDialog branches={branches} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.role === 'manager' ? getBranchName(user.branchId) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AddUserDialog({ branches }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [branchId, setBranchId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: 'User created successfully' });
      setOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('manager');
      setBranchId('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ name, email, password, role, branchId: role === 'manager' ? branchId : null }); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === 'manager' && (
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} ({branch.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExpenseTrackerApp />
      <Toaster />
    </QueryClientProvider>
  );
}