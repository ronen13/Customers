# מערכת ניהול מענקים

## פריסה ב-Render

### שלב 1 — GitHub
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USER/grants-portal.git
git push -u origin main
```

### שלב 2 — Render Blueprint
1. render.com → New → Blueprint
2. בחר את ה-repo
3. Render יקרא את `render.yaml` ויצור Web Service + PostgreSQL אוטומטית
4. **שנה את ADMIN_PASSWORD** ב-Environment Variables לסיסמה שלך
5. לחץ Apply

## כתובות
- `/login` — כניסת מנהל
- `/admin` — ניהול לקוחות  
- `/client/TOKEN` — פורטל לקוח (ללא סיסמה)

## סיסמת ברירת מחדל
`admin123` — שנה ב-Render → Environment → ADMIN_PASSWORD
