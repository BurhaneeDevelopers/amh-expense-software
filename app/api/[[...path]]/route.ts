import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = 'expense_tracker';

let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db;
}

// Helper function to parse request body
async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Auth endpoints
async function handleLogin(request) {
  const body = await parseBody(request);
  const { email, password } = body;

  const db = await connectDB();
  const user = await db.collection('users').findOne({ email });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json({ user: userWithoutPassword });
}

async function handleGetCurrentUser(request, userId) {
  const db = await connectDB();
  const user = await db.collection('users').findOne({ id: userId });
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json({ user: userWithoutPassword });
}

// Branch endpoints
async function handleGetBranches() {
  const db = await connectDB();
  const branches = await db.collection('branches').find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ branches });
}

async function handleCreateBranch(request) {
  const body = await parseBody(request);
  const { name, city, location } = body;

  if (!name || !city) {
    return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
  }

  const db = await connectDB();
  const branch = {
    id: uuidv4(),
    name,
    city,
    location: location || '',
    createdAt: new Date().toISOString(),
  };

  await db.collection('branches').insertOne(branch);
  return NextResponse.json({ branch });
}

async function handleUpdateBranch(request, branchId) {
  const body = await parseBody(request);
  const { name, city, location } = body;

  const db = await connectDB();
  const result = await db.collection('branches').updateOne(
    { id: branchId },
    { $set: { name, city, location } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

async function handleDeleteBranch(request, branchId) {
  const db = await connectDB();
  
  // Check if any users are assigned to this branch
  const usersCount = await db.collection('users').countDocuments({ branchId });
  if (usersCount > 0) {
    return NextResponse.json({ error: 'Cannot delete branch with assigned users' }, { status: 400 });
  }

  const result = await db.collection('branches').deleteOne({ id: branchId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// User endpoints
async function handleGetUsers() {
  const db = await connectDB();
  const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  return NextResponse.json({ users: usersWithoutPasswords });
}

async function handleCreateUser(request) {
  const body = await parseBody(request);
  const { name, email, password, role, branchId } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (role !== 'admin' && !branchId) {
    return NextResponse.json({ error: 'Branch is required for managers' }, { status: 400 });
  }

  const db = await connectDB();
  
  // Check if email already exists
  const existingUser = await db.collection('users').findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    role,
    branchId: branchId || null,
    createdAt: new Date().toISOString(),
  };

  await db.collection('users').insertOne(user);
  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json({ user: userWithoutPassword });
}

async function handleUpdateUser(request, userId) {
  const body = await parseBody(request);
  const { name, email, role, branchId, password } = body;

  const db = await connectDB();
  const updateData = { name, email, role, branchId };
  
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const result = await db.collection('users').updateOne(
    { id: userId },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

async function handleDeleteUser(request, userId) {
  const db = await connectDB();
  const result = await db.collection('users').deleteOne({ id: userId });
  
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// Transaction endpoints
async function handleGetTransactions(request) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const type = searchParams.get('type');

  const db = await connectDB();
  const query = {};
  
  if (branchId) {
    query.branchId = branchId;
  }
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  if (type) {
    query.type = type;
  }

  const transactions = await db.collection('transactions')
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  return NextResponse.json({ transactions });
}

async function handleCreateTransaction(request) {
  const body = await parseBody(request);
  const { type, amount, method, category, note, date, userId, branchId } = body;

  if (!type || !amount || !date || !userId || !branchId) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  if (type === 'income' && !method) {
    return NextResponse.json({ error: 'Payment method is required for income' }, { status: 400 });
  }

  if (type === 'expense' && !category) {
    return NextResponse.json({ error: 'Category is required for expense' }, { status: 400 });
  }

  const db = await connectDB();
  const transaction = {
    id: uuidv4(),
    type,
    amount: parseFloat(amount),
    method: method || null,
    category: category || null,
    note: note || '',
    date,
    userId,
    branchId,
    createdAt: new Date().toISOString(),
  };

  await db.collection('transactions').insertOne(transaction);
  return NextResponse.json({ transaction });
}

async function handleUpdateTransaction(request, transactionId) {
  const body = await parseBody(request);
  const { type, amount, method, category, note, date } = body;

  const db = await connectDB();
  const updateData = {
    type,
    amount: parseFloat(amount),
    method,
    category,
    note,
    date,
  };

  const result = await db.collection('transactions').updateOne(
    { id: transactionId },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

async function handleDeleteTransaction(request, transactionId) {
  const db = await connectDB();
  const result = await db.collection('transactions').deleteOne({ id: transactionId });
  
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// Analytics endpoints
async function handleGetAnalytics(request) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const db = await connectDB();
  const query = {};
  
  if (branchId) {
    query.branchId = branchId;
  }
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const transactions = await db.collection('transactions').find(query).toArray();
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  // Income by method
  const incomeByMethod = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.method] = (acc[t.method] || 0) + t.amount;
      return acc;
    }, {});

  // Expense by category
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  // Daily totals
  const dailyData = transactions.reduce((acc, t) => {
    if (!acc[t.date]) {
      acc[t.date] = { date: t.date, income: 0, expense: 0, balance: 0 };
    }
    if (t.type === 'income') {
      acc[t.date].income += t.amount;
    } else {
      acc[t.date].expense += t.amount;
    }
    return acc;
  }, {});

  // Calculate cumulative balance for each day
  const dailyArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  let cumulativeBalance = 0;
  dailyArray.forEach(day => {
    cumulativeBalance += day.income - day.expense;
    day.balance = cumulativeBalance;
  });

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance,
    incomeByMethod,
    expenseByCategory,
    dailyData: dailyArray,
  });
}

// Initialize default data
async function handleInitialize() {
  const db = await connectDB();
  
  // Check if already initialized
  const existingUsers = await db.collection('users').countDocuments();
  if (existingUsers > 0) {
    return NextResponse.json({ message: 'Already initialized' });
  }

  // Create default admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = {
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@company.com',
    password: hashedPassword,
    role: 'admin',
    branchId: null,
    createdAt: new Date().toISOString(),
  };

  await db.collection('users').insertOne(admin);

  // Create default branches
  const branches = [
    {
      id: uuidv4(),
      name: 'Main Branch',
      city: 'Mumbai',
      location: 'Andheri West',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: 'North Branch',
      city: 'Delhi',
      location: 'Connaught Place',
      createdAt: new Date().toISOString(),
    },
  ];

  await db.collection('branches').insertMany(branches);

  // Create a manager for each branch
  const managerPassword = await bcrypt.hash('manager123', 10);
  const managers = branches.map((branch, index) => ({
    id: uuidv4(),
    name: `Manager ${index + 1}`,
    email: `manager${index + 1}@company.com`,
    password: managerPassword,
    role: 'manager',
    branchId: branch.id,
    createdAt: new Date().toISOString(),
  }));

  await db.collection('users').insertMany(managers);

  return NextResponse.json({ 
    message: 'Initialized successfully',
    credentials: {
      admin: { email: 'admin@company.com', password: 'admin123' },
      manager: { email: 'manager1@company.com', password: 'manager123' },
    }
  });
}

// Main route handler
export async function GET(request, { params }) {
  try {
    const path = params?.path || [];
    const route = path.join('/');

    if (route === 'branches') {
      return await handleGetBranches();
    }
    
    if (route === 'users') {
      return await handleGetUsers();
    }
    
    if (route === 'transactions') {
      return await handleGetTransactions(request);
    }
    
    if (route === 'analytics') {
      return await handleGetAnalytics(request);
    }
    
    if (route === 'initialize') {
      return await handleInitialize();
    }
    
    if (route.startsWith('users/')) {
      const userId = route.split('/')[1];
      return await handleGetCurrentUser(request, userId);
    }

    return NextResponse.json({ message: 'API is running' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const path = params?.path || [];
    const route = path.join('/');

    if (route === 'login') {
      return await handleLogin(request);
    }
    
    if (route === 'branches') {
      return await handleCreateBranch(request);
    }
    
    if (route === 'users') {
      return await handleCreateUser(request);
    }
    
    if (route === 'transactions') {
      return await handleCreateTransaction(request);
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const path = params?.path || [];
    const route = path.join('/');

    if (route.startsWith('branches/')) {
      const branchId = route.split('/')[1];
      return await handleUpdateBranch(request, branchId);
    }
    
    if (route.startsWith('users/')) {
      const userId = route.split('/')[1];
      return await handleUpdateUser(request, userId);
    }
    
    if (route.startsWith('transactions/')) {
      const transactionId = route.split('/')[1];
      return await handleUpdateTransaction(request, transactionId);
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const path = params?.path || [];
    const route = path.join('/');

    if (route.startsWith('branches/')) {
      const branchId = route.split('/')[1];
      return await handleDeleteBranch(request, branchId);
    }
    
    if (route.startsWith('users/')) {
      const userId = route.split('/')[1];
      return await handleDeleteUser(request, userId);
    }
    
    if (route.startsWith('transactions/')) {
      const transactionId = route.split('/')[1];
      return await handleDeleteTransaction(request, transactionId);
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}