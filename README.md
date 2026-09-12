# Litter Watch — Camera-Based Detection System (No Backend)

Signup/login karke dashboard open karo → camera permission mangega → live feed dikhega →
har second frame check hota hai → jaha significant change (litter thrown) detect ho,
wahi frame automatically Supabase Storage mein save + database mein log ho jata hai.
Koi custom backend server nahi — frontend seedha Supabase se baat karta hai.

## 1. Supabase Project Setup (5 min)

1. [supabase.com](https://supabase.com) pe free account banao → "New Project"
2. Project ready hone ke baad, **Project Settings → API** mein jao — yahan se `Project URL` aur `anon public key` copy karo
3. **SQL Editor** tab kholo, `supabase-schema.sql` file ka pura content paste karke Run karo — ye `profiles` + `detections` tables aur security rules bana dega
4. **Storage** tab mein jao → "New bucket" → naam do `screenshots` → **Public** bucket rakho (demo/college project ke liye simplest)

## 2. Project Setup (Local)

```bash
npm install
cp .env.example .env
```

`.env` file kholo aur apne Supabase URL + anon key daalo:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

```bash
npm run dev
```

Browser mein `http://localhost:5173` khulega.

**Important:** Camera access sirf HTTPS ya `localhost` pe kaam karta hai (browser security rule) — local development mein fine hai, deploy karte waqt Vercel/Netlify automatically HTTPS de dete hain.

## 3. Deploy (Free)

1. Code ko GitHub repo mein push karo
2. [vercel.com](https://vercel.com) pe jao → "Import Project" → apna repo select karo
3. Environment variables mein wahi `VITE_SUPABASE_URL` aur `VITE_SUPABASE_ANON_KEY` add karo
4. Deploy — turant live link mil jayega

## How It Works

```
Signup/Login (Supabase Auth)
        ↓
Dashboard open → camera permission request
        ↓
Live video feed (top area) + ☰ menu (top-right)
        ↓
Har 1 second: current frame ko pichle frame se compare karo (pixel difference)
        ↓
Change > sensitivity threshold?
   NO  → frame discard, kuch save nahi hota
   YES → frame ko image banao → Supabase Storage upload → detections table mein entry
        ↓
Gallery (☰ menu ke andar) real-time update ho jati hai
```

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx        → Supabase Auth login
│   ├── Signup.jsx        → Supabase Auth signup + profile creation
│   └── Dashboard.jsx      → main screen: camera + menu, data fetching
├── components/
│   ├── CameraFeed.jsx     → camera access, per-second frame check, upload logic
│   └── HamburgerMenu.jsx  → ☰ menu: profile, sensitivity setting, gallery
├── lib/
│   ├── supabaseClient.js  → Supabase connection (auth + db + storage)
│   ├── AuthContext.jsx    → tracks logged-in session app-wide
│   └── detection.js       → frame-difference math (the "AI" logic, no ML model)
└── index.css
```

## Detection Logic — Kaise Kaam Karta Hai

Ye **pixel-difference based motion detection** use karta hai, na ki heavy ML model —
isliye no backend, no GPU, sab kuch browser mein instantly chalta hai:

1. Har second video ka ek frame canvas pe draw hota hai
2. Us frame ke pixels ko pichle second ke frame se compare kiya jata hai
3. Agar kaafi pixels change hue (matlab kuch naya frame mein aaya) — threshold cross ho gaya
4. Threshold cross hote hi image capture + upload trigger hota hai
5. 5-second cooldown lagta hai taaki ek hi event ke liye baar-baar capture na ho

**Trade-off (judges ko batana):** Ye approach fast aur backend-free hai, lekin ye sirf
"movement/change" detect karta hai — "ye specifically kachra hai" nahi pehchanta
(vo TensorFlow.js jaise object-detection model se hota, jo aage upgrade ho sakta hai).
Sensitivity slider (☰ → Settings) se false positives kam-zyada kar sakte ho.

## Free Tier Limits (Supabase)

- 1 GB storage, 2 GB bandwidth/month — college demo ke liye kaafi hai
- Sirf detected frames save hoti hain (na ki har second ki), isliye storage bahut kam use hoga
