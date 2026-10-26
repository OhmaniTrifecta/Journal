# My Journal 📔

A cute, private journal web app made for iPhone. Entries stay on the phone and are never uploaded.

## Features
- 🔐 4-digit secret code with a hint, plus auto-lock
- 😊 Mood picker and a monthly mood calendar
- 💡 Daily writing prompts
- ✨ "3 good things today" gratitude list
- 📸 Photos in entries
- 💌 "On this day" memories
- 🔍 Search, favorites and filters
- 🔥 Streaks and an 18-sticker sticker book
- 🎨 6 color themes, including dark mode
- 💛 **Comfort Corner** for hard days: breathing bubble, kind notes, "let a worry float away", 5-4-3-2-1 calm-down, a happy jar of her own good memories, feel-better ideas, and who to talk to
- 🫂 Gentle, mood-specific encouragement and prompts when she's worried, sad or mad, plus stickers for coping (Brave Heart, Calm Cloud, Let It Go)
- 🆘 If an entry mentions wanting to hurt herself, a caring message encourages her to talk to a trusted adult and shows the 988 Lifeline (call/text). Nothing is sent anywhere; it only shows on her phone.
- 💾 Backup and restore to a file
- 📴 Works offline after the first visit

## Deploy
1. Push this folder to a GitHub repo.
2. In Vercel, click **Add New → Project**, import the repo, and click **Deploy** (no settings needed, it's a static site).
3. On the iPhone, open the Vercel URL in **Safari**, tap **Share → Add to Home Screen**.

## Important: backups
Everything is saved in the phone's browser storage for this app. If the app is deleted from the Home Screen, or Safari website data is cleared, the entries are gone. Use **Settings → Save backup** now and then (save it to iCloud Drive).

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.
