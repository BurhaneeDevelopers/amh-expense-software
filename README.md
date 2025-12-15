# Multi-Branch Expense Tracker

A comprehensive expense tracking application designed for multi-branch companies. Track income and expenses across multiple branches with role-based access control.

## Features

### 🔐 Authentication
- Secure login system with bcrypt password hashing
- Role-based access control (Admin & Manager)
- Session management with localStorage

### 👥 User Roles

#### Admin
- Access to all branches
- View consolidated reports across branches
- Create and manage branches
- Create and manage users (managers and admins)
- Add transactions for any branch
- View branch-wise breakdown of transactions

#### Manager
- Access to assigned branch only
- Add income and expense transactions
- View daily transactions and balance
- Generate reports for their branch

### 💰 Transaction Management

#### Income Tracking
- Payment methods: Cash, GPay, Bank Transfer
- Date-based filtering
- Custom notes for each transaction
- Real-time balance calculation

#### Expense Tracking
- Predefined categories:
  - Rent
  - Utilities
  - Salaries
  - Supplies
  - Maintenance
  - Transportation
  - Marketing
  - Other
- Custom notes for additional details
- Date-based filtering

### 📊 Dashboard Features
- Daily income summary
- Daily expense summary
- Daily balance (Income - Expense)
- Date picker for viewing historical data
- Branch-wise transaction display (Admin)
- Transaction table with type, amount, method/category, and notes

### 📈 Reports & Analytics
- Date range filtering
- Branch-wise filtering (Admin)
- Total income and expense summaries
- Net balance calculation
- Income breakdown by payment method
- Expense breakdown by category
- Daily breakdown table with cumulative balance
- Visual data presentation

### 🏢 Branch Management (Admin Only)
- Create new branches
- View all branches with location details
- Assign managers to specific branches

### 👤 User Management (Admin Only)
- Create new users (Admin/Manager)
- Assign managers to branches
- View all users with their roles and assignments

## Tech Stack

- **Frontend**: Next.js 14, React 18
- **UI Components**: ShadCN UI, Tailwind CSS
- **Data Fetching**: TanStack React Query
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: bcrypt for password hashing
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables in `.env`:
```
MONGO_URL=your_mongodb_connection_string
NEXT_PUBLIC_BASE_URL=your_app_url
```

4. Run the development server:
```bash
yarn dev
```

5. Initialize the system (first-time setup):
   - Navigate to http://localhost:3000
   - Click "Initialize System (First Time Setup)"
   - This creates default admin and sample branches

### Default Credentials

After initialization:

**Admin Account:**
- Email: `admin@company.com`
- Password: `admin123`

**Manager Account:**
- Email: `manager1@company.com`
- Password: `manager123`

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create new branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Transactions
- `GET /api/transactions` - Get transactions (with filters)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Analytics
- `GET /api/analytics` - Get analytics data (with filters)

### System
- `GET /api/initialize` - Initialize system with default data

## Database Schema

### Users Collection
```javascript
{
  id: String (UUID),
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/manager),
  branchId: String (null for admin),
  createdAt: ISO Date String
}
```

### Branches Collection
```javascript
{
  id: String (UUID),
  name: String,
  city: String,
  location: String,
  createdAt: ISO Date String
}
```

### Transactions Collection
```javascript
{
  id: String (UUID),
  type: String (income/expense),
  amount: Number,
  method: String (for income: cash/gpay/bank_transfer),
  category: String (for expense: Rent/Utilities/etc),
  note: String,
  date: Date String (YYYY-MM-DD),
  userId: String,
  branchId: String,
  createdAt: ISO Date String
}
```

## Features Overview

### Dashboard
- View daily income, expense, and balance
- Filter by date
- Admin: View all branches with individual balances
- Manager: View assigned branch transactions
- Add new transactions with dialog form

### Reports
- Comprehensive analytics dashboard
- Date range filtering
- Branch-wise filtering (Admin)
- Income by payment method breakdown
- Expense by category breakdown
- Daily breakdown with cumulative balance

### Admin Panel
- **Branches Tab**: Create and manage branches
- **Users Tab**: Create and manage users with role assignment

## UI/UX Features

- Beautiful gradient backgrounds
- Color-coded transaction types (green for income, red for expense)
- Responsive design
- Loading states
- Toast notifications for user feedback
- Modal dialogs for forms
- Tabbed navigation
- Date pickers for easy date selection
- Dropdown selectors for categories and branches

## Security Features

- Password hashing with bcrypt
- Role-based access control
- Session management
- Input validation
- Error handling

## Future Enhancements (Supabase Integration)

The application is designed to integrate with Supabase for:
- Enhanced authentication (OAuth, Magic Links)
- Real-time updates
- Row-level security
- Cloud database hosting

## Development

### Project Structure
```
/app
├── app/
│   ├── api/[[...path]]/route.js  # Backend API routes
│   ├── page.js                    # Main frontend application
│   ├── layout.js                  # Root layout
│   └── globals.css                # Global styles
├── components/ui/                 # ShadCN UI components
├── lib/                          # Utility functions
└── package.json                  # Dependencies
```

### Code Organization
- Single-page application with tabbed navigation
- TanStack React Query for efficient data fetching and caching
- Separation of concerns: Login, Dashboard, Reports, Admin Panel
- Reusable components for forms and tables

## Support

For issues or questions, please contact the development team.

## License

Proprietary - All rights reserved
