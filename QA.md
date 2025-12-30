\# ReflectApp2 QA Smoke Test (5–10 minutes)



\## Setup

\- Run: `npm install`

\- Run: `npm run dev`

\- Open: http://localhost:5173

\- Open DevTools Console (must stay clean: no red errors)



---



\## 1) Onboarding

\- Enter name + profession

\- Confirm it persists after refresh (Cmd/Ctrl+R)



✅ Expected:

\- No red console errors

\- Profile name/profession visible in app



---



\## 2) Dashboard

\- Confirm greeting renders

\- Confirm daily prompt renders (even without API key)



✅ Expected:

\- If no key: prompt still appears (mock fallback)

\- No red console errors



---



\## 3) ReflectionFlow

\- Start a reflection model

\- Enter text in a couple stages

\- Save entry

\- If “Unlock Insight” exists: try it (should not crash without key)



✅ Expected:

\- Entry saved and visible in Archive/History

\- Without key: insight shows “unavailable” message (no crash)



---



\## 4) Archive / History

\- Search for a word from the entry

\- Toggle filters (if any)

\- Toggle blur mode (if any)

\- Try print (if available)



✅ Expected:

\- No crashes; search returns correct results



---



\## 5) Oracle

\- Open Oracle

\- Ask a question about your saved entry



✅ Expected:

\- Without key: shows locked/graceful message (no crash)

\- With key: returns response based on local entries



---



\## 6) Holodeck

\- Open Holodeck

\- Confirm scenario list shows 18–20 items

\- Start one scenario

\- Send a message, receive a reply



✅ Expected:

\- Persona reply returns (mock or real)

\- Emotion color applied (or defaults)



---



\## 7) QuickCapture

\- Open QuickCapture

\- Try camera/audio/video UI

\- Confirm guardian badge renders and does not crash without key



✅ Expected:

\- Guardian status shows SAFE/CAUTION

\- No permission loops; no hard crashes



---



\## 8) DriveMode

\- Open DriveMode

\- If speech APIs unavailable: it must not crash; show fallback message

\- If available: confirm speak → listen → save → next loop

\- Try stop command (“Stop” / “Exit”)



✅ Expected:

\- Always usable; no red errors



---



\## 9) Profile

\- Edit name and profession

\- Toggle blur/lock options (if present)



✅ Expected:

\- Saves and reflects instantly; no crashes



---



\## 10) Offline reload

\- In DevTools → Network → Offline

\- Refresh page



✅ Expected:

\- App loads and shows previously saved entries

\- No red errors



