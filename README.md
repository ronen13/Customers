# מערכת ניהול מענקים 🏛️

פורטל לניהול תיקי מענקים — ניהול לקוחות, סטטוס פרקים, ושליחת מיילים אוטומטית.

---

## פריסה על Render (5 דקות)

### שלב 1 — העלאה ל-GitHub
```bash
git init
git add .
git commit -m "initial commit"
# צור repo חדש ב-GitHub ואז:
git remote add origin https://github.com/YOUR_USERNAME/grants-portal.git
git push -u origin main
```

### שלב 2 — פריסה ב-Render
1. כנס ל־ [render.com](https://render.com) והתחבר
2. לחץ **"New +"** → **"Web Service"**
3. חבר את ה-GitHub repo שיצרת
4. מלא את הפרטים:
   - **Name:** grants-portal
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
5. לחץ **"Create Web Service"**

הפריסה תיקח ~2 דקות. תקבל URL בפורמט `https://grants-portal.onrender.com`

---

## הרצה מקומית

```bash
npm install
npm run dev
```
הפורטל יעלה על `http://localhost:3000`

---

## מבנה הפרויקט

```
grants-portal/
├── src/
│   ├── App.jsx       ← כל הלוגיקה והתצוגה
│   └── main.jsx      ← נקודת כניסה
├── index.html
├── vite.config.js
├── render.yaml       ← הגדרות Render
└── package.json
```

---

## תכונות עיקריות

- **ניהול לקוחות** — כרטיס לכל לקוח עם פרטים, מועד הגשה וקישור לפורטל
- **סטטוס פרקים** — הושלם / בתהליך / חסר מסמכים / בבדיקה / לא רלוונטי
- **מייל אוטומטי** — לחיצה אחת פותחת Outlook עם רשימת מסמכים חסרים + קישור לפורטל
- **תצוגת לקוח** — מה הלקוח רואה בפורטל שלו
- **חיפוש מהיר** — לפי שם, מענק או אימייל
- **RTL מלא** — תמיכה מלאה בעברית
