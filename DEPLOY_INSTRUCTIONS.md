# How to Deploy "Simply Dice" to GitHub Pages

Since I cannot directly access your GitHub account, please follow these simple steps to put your app online!

## Prerequisites
- You need a [GitHub Account](https://github.com/).
- You need `git` installed on your computer.

## Step 1: Create a Repository
1. Go to [GitHub.com/new](https://github.com/new).
2. Repository name: `simply-dice` (or any name you like).
3. **Important**: Make it **Public** (required for free GitHub Pages).
4. Click **Create repository**.

## Step 2: Push Your Code
Open your terminal (PowerShell or Command Prompt) and run these commands one by one in your project folder:

```powershell
# Initialize git if you haven't already
git init

# Add all files
git add .

# Save the version
git commit -m "Initial deploy"

# Link to your new repository
# REPLACE 'YOUR_USERNAME' WITH YOUR ACTUAL GITHUB USERNAME!
git remote add origin https://github.com/YOUR_USERNAME/simply-dice.git

# Send it to GitHub
git push -u origin main
```

## Step 3: Turn on GitHub Pages
1. Go to your repository page on GitHub.
2. Click **Settings** (top right tab).
3. On the left sidebar, click **Pages**.
4. Under **Build and deployment** > **Source**, select **GitHub Actions**.
   *(Note: Since we have a `.github/workflows/deploy.yml` file, GitHub might detect this automatically. If you see "GitHub Actions" already selected or suggested, that's perfect.)*
   
   **Alternative (if "GitHub Actions" setup is confusing):**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** (This branch will be created automatically if you use the workflow, but for manual setup, the "GitHub Actions" option is best because we included a workflow file for you).

## Step 4: Get Your Link!
- Once you push, click the **Actions** tab on your GitHub repository.
- You will see a workflow running (usually called "Deploy to GitHub Pages" or similar).
- When it turns 🟢 Green, click on it, then look for the **deploy** job.
- Your link will be shown there! It usually looks like:
  `https://YOUR_USERNAME.github.io/simply-dice/`

## Troubleshooting
- **White screen?**
  - I already updated `vite.config.ts` to use `base: './'`, so it should work automatically.
  - Check the Console (F12) for errors.
