# Deploying Stemmy to Vercel

## 1. Push to GitHub
If you haven't already, initialize the repository and push to GitHub:
```bash
git init
git add .
git commit -m "feat: rebrand to Stemmy"
git branch -M main
# Replace <YOUR_REPO_URL> with the actual repository URL
# git remote add origin <YOUR_REPO_URL>
# git push -u origin main
```

## 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click "Add New..." -> "Project".
3. Import your GitHub repository.
4. Framework Preset should automatically detect "Vite".
5. Click **Deploy**.

## 3. Set Custom Domain (stemmy.app)
1. Once deployed, go to the Project Dashboard.
2. Go to **Settings** -> **Domains**.
3. Enter `stemmy.app` and click **Add**.
4. Configure your DNS settings as instructed by Vercel (add A record or CNAME).

## 4. Production Check
- Verify that PWA installation works.
- Verify that "Stemmy" branding appears everywhere.
- Test basic functionality (timers, login, etc).
