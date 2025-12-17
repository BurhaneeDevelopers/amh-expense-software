# GitHub Deployment Guide

## Step-by-Step Instructions to Deploy to GitHub

### Step 1: Create a New Repository on GitHub

1. Go to [GitHub](https://github.com)
2. Log in to your account
3. Click the **"+"** icon in the top-right corner
4. Select **"New repository"**
5. Fill in the details:
   - **Repository name**: `expense-tracker` (or your preferred name)
   - **Description**: "Multi-branch expense tracking application with role-based access control"
   - **Visibility**: Public ✓
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Step 2: Copy the Repository URL

After creating the repository, you'll see a page with setup instructions. Copy the **HTTPS URL** which looks like:
```
https://github.com/YOUR_USERNAME/expense-tracker.git
```

### Step 3: Connect Your Local Repository to GitHub

You have two options:

#### Option A: Using the Emergent Terminal (Recommended)

If you have access to the Emergent terminal, run these commands:

```bash
cd /app
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

#### Option B: Manual Download and Push

If you don't have terminal access:

1. Download the project files from Emergent
2. On your local machine, open terminal/command prompt
3. Navigate to the project folder
4. Run these commands:

```bash
cd path/to/expense-tracker
git init
git add -A
git commit -m "Initial commit: Multi-branch expense tracker application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git push -u origin main
```

### Step 4: Verify the Upload

1. Go to your GitHub repository URL
2. Refresh the page
3. You should see all your project files uploaded

### Important Notes

#### Before Pushing to GitHub:

1. **Environment Variables**: Make sure your `.env` file is in `.gitignore` (it already is)
2. **Sensitive Data**: The `.env` file with MongoDB connection string will NOT be pushed (as it should be)
3. **Dependencies**: The `node_modules` folder is also ignored

#### After Pushing to GitHub:

Users who clone your repository will need to:

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
```

2. Install dependencies:
```bash
yarn install
```

3. Create their own `.env` file:
```bash
MONGO_URL=your_mongodb_connection_string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Run the application:
```bash
yarn dev
```

5. Initialize the system:
- Visit http://localhost:3000
- Click "Initialize System (First Time Setup)"

### GitHub Repository Best Practices

#### Add a GitHub Actions CI/CD (Optional)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: yarn install
    - run: yarn build
```

#### Add Branch Protection (Optional)

1. Go to Repository Settings → Branches
2. Add branch protection rule for `main`
3. Enable "Require pull request reviews before merging"

### Collaboration Features

- **Issues**: Track bugs and feature requests
- **Pull Requests**: Review code changes
- **Projects**: Manage development workflow
- **Wiki**: Create documentation
- **Discussions**: Community discussions

### Need Help?

If you encounter any issues:
1. Check if git is installed: `git --version`
2. Verify your GitHub credentials are set up
3. Make sure you have write access to the repository
4. Check that the repository URL is correct

### Repository URL Format

- **HTTPS**: `https://github.com/USERNAME/REPO.git`
- **SSH**: `git@github.com:USERNAME/REPO.git`

Use HTTPS if you're not sure. GitHub will prompt for your credentials.

---

**Your repository is ready to be shared with the world! 🚀**
