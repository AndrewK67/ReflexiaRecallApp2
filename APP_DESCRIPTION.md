# Reflexia - Complete Application Description

## Identity & Purpose

Reflexia is a reflective practice and CPD (Continuing Professional Development) tracking application designed primarily for healthcare professionals (nurses, doctors, paramedics, pharmacists, etc.) but supporting 30+ professions across healthcare, education, emergency services, and corporate sectors. It is a Progressive Web App (PWA) built with React 19, Vite, TailwindCSS, and Capacitor for optional Android native packaging.

**Core value proposition:** One app where professionals can capture experiences, reflect on them using structured clinical models, track CPD hours against regulatory standards (NMC, GMC, HCPC, GPhC, etc.), and export professional documentation — all stored privately on-device.

**Current state:** Configured for offline-only nurse user testing in the UK. No AI API key is shipped. The app runs as a PWA distributed via URL (not APK).

---

## Tech Stack & Architecture

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS
- **State management:** Centralized in App.tsx (god component with prop drilling, no router or state library)
- **Navigation:** State-based SPA using a `ViewState` string (`"DASHBOARD"`, `"REFLECTION"`, `"ARCHIVE"`, etc.) — no URL routing
- **Persistence:** localStorage only (via storageService.ts with safeSetItem wrapper). Media files stored in IndexedDB (via fileStorageService.ts)
- **Feature gating:** Pack system (packService.ts, packRegistry.ts, packTypes.ts) — modular opt-in for advanced features
- **AI:** Gemini API (aiService.ts) with OfflineProvider fallback for when no API key is configured
- **Code splitting:** Critical components eager-loaded (Dashboard, Onboarding, Navigation), feature components lazy-loaded via React.lazy()

---

## Visual Design

- **Theme:** Dark mode by default (slate-900/slate-950 gradients). Optional light mode toggle exists
- **Background:** Animated backdrop with floating gradient orbs (CSS animations) and grain texture overlay
- **Accent colors:** Cyan-to-indigo gradient for primary CTAs, emerald for success/confirmation, red for recording/danger, orange for streaks
- **Typography:** System font stack, monospace for timers/stats, bold/extrabold headings
- **Cards:** Glassmorphism style — `bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl`
- **Navigation bar:** White rounded pill at bottom with 3 buttons (Archive, Home, Profile). Home button is elevated with shadow

---

## Onboarding Flow (SimplifiedOnboarding)

3-screen flow, fully skippable:

**Screen 1 — "Capture Anything"**
- Large camera emoji icon
- Explains: text, voice, photos capture. Private on-device storage
- Highlights: Quick, Safe, Rich

**Screen 2 — "Reflect Deeply"**
- Large thought bubble emoji
- Explains: Simple prompts guide thinking, process experiences
- Highlights: Simple, Flexible, Personal

**Screen 3 — "Retrieve & Export"**
- Large magnifying glass emoji
- Explains: Search, filter, export to PDF/ZIP
- Has name input field ("What should we call you?")
- Has profession dropdown selector (Healthcare group: Nursing, Medical, Paramedic, etc. Other group: Education, Legal, Business, etc.)
- Defaults to NURSING profession
- "Start Capturing" button completes onboarding

Progress shown via 3 dots at top. Skip button (X) in top-right at all times.

---

## Dashboard (SimplifiedDashboard)

The main hub after onboarding. Shows:

**Greeting:** Time-of-day greeting + first name (e.g., "Good afternoon, Sarah.")

**Daily prompt:** Rotating motivational/reflective quote in italics (offline-generated if no AI)

**Quick Stats (if entries exist):**
- Reflection count badge
- Current streak badge (in days, orange text)

**Core Action Buttons:**
- **Capture** (primary, full-width, cyan-to-indigo gradient) — navigates to Quick Capture
- **Reflect** (half-width, glass style) — navigates to Reflection Flow
- **Archive** (half-width, glass style) — navigates to Archive

**Enabled Packs Section** (only if any optional packs enabled):
- Grid of small icon buttons for enabled features:
  - Wellbeing pack: BioRhythm, Grounding
  - AI pack: Oracle
  - Scenario pack: Holodeck
  - Professional pack: CPD, Docs
  - Reports pack: Reports

**"Explore Optional Packs"** text link — opens Pack Browser

**Footer:** "All data stored securely on this device" / "Export regularly to back up"

---

## Bottom Navigation Bar

Fixed at bottom of screen. 3 buttons in a white rounded pill:

1. **Archive** (left) — BookOpen icon + "Archive" label
2. **Home** (center, elevated) — Home icon in dark rounded square, pushed up above the bar
3. **Profile** (right) — User icon + "Profile" label

Active state: indigo-600 color. Inactive: slate-500.

---

## Quick Capture (QuickCapture)

Multi-tab capture screen with 3 tabs: **Text**, **Photo**, **Audio**

**Text Tab:**
- Large textarea: "Describe what happened. No filter. No judgement."
- Guardian safety check runs in real-time on text input
- If high-risk keywords detected (suicide, self-harm, etc.): Shows red alert card with crisis resources (Samaritans 116 123, Shout 85258, NHS 111)
- If medium-risk keywords detected (panic, hopeless, etc.): Shows amber card with self-care suggestions
- Media thumbnails section (if photo/audio captured): Shows attached media with "Save to device" buttons
- Save button at bottom (disabled if empty)

**Photo Tab:**
- Camera viewfinder fills the content area (below the header tabs)
- Top overlay: Close (X) button + Flash toggle (Zap icon)
- Bottom bar: Flip camera button (left), Capture button (center, white circle), spacer (right)
- After capture: Shows preview with Retake / Use Photo buttons
- Uses `getUserMedia` API (requires HTTPS)

**Audio Tab:**
- Recording interface fills content area
- Center: Pulsing microphone icon in red circle (scales with audio level during recording)
- Recording indicator dot (red, pulsing) when active
- Timer display (MM:SS format, monospace)
- Audio level visualization: 20 vertical bars that animate with audio input
- Bottom: Record button (red circle) / Stop button (red square)
- After recording: Preview screen with checkmark, duration, play/pause button, audio player
- Retake / Use Audio buttons

**Save Flow:**
- Text + any attached media bundled into an IncidentEntry
- Audio blob URLs converted to IndexedDB storage (idb:// paths) on save
- Entry saved to localStorage via storageService
- Returns to Dashboard after save

---

## Reflection Flow (ReflectionFlow)

Structured reflection using clinical/professional models. Available models:

| Model | Steps | Use Case |
|-------|-------|----------|
| SIMPLE | What happened → What mattered → Moving forward | Quick 3-step reflection |
| GIBBS | Description → Feelings → Evaluation → Analysis → Conclusion → Action Plan | Classic 6-stage reflective cycle |
| SBAR | Situation → Background → Assessment → Recommendation | Clinical communication framework |
| ERA | Experience → Reflection → Action | Simple 3-stage model |
| ROLFE | What → So What → Now What | Quick analytical model |
| STAR | Situation → Task → Action → Result | Competency-based reflection |
| SOAP | Subjective → Objective → Assessment → Plan | Clinical documentation model |
| MORNING | Energy → Focus → Intention | Morning check-in |
| EVENING | Wins → Growth → Unwind | Evening wind-down |
| FREE | Open writing | No structure, free-form |
| CUSTOM 1-3 | User-defined | Custom reflection templates |

Each stage shows a prompt and placeholder text tailored to the selected model. Profession context shapes the AI prompts (e.g., nursing prompts reference NMC standards).

The flow saves a ReflectionEntry with: model ID, answers (keyed by stage), optional mood rating (1-5), optional CPD log, and optional AI insights.

---

## Archive

Searchable, filterable history of all entries.

**Header:** Search bar + filter toggle button

**Filters:**
- Sort: Date (newest/oldest)
- Type filter options

**Entry List:** Paginated (20 per page) with:
- Date/time
- Entry type badge (Reflection/Incident)
- Model name (for reflections)
- Truncated text preview
- Media indicators:
  - Photo: Camera icon with count
  - Audio: Play/Pause button with inline progress bar + Download button
  - Video: Video icon with count
- Blur overlay if privacy blur is enabled

**Audio Playback:** Inline play/pause with progress scrubber and duration display. Audio from IndexedDB (idb:// URLs) is resolved via readMediaFile() before playback.

**Audio Download:** Resolves idb:// URLs to blobs, creates download link.

**Entry Detail Modal** (opens from Archive or Calendar):
- Full entry content
- Media attachments (photos displayed inline, audio with "Save to Documents" button)
- Close button

---

## Profile / Settings (NeuralLink)

Scrollable settings screen with sections:

**Identity:**
- Name display (editable with pencil icon)
- Profession label and description

**Feature Switches:**
- AI toggle (ON/OFF)
- Gamification toggle (ON/OFF)
- Privacy Lock toggle (ON/OFF)
- Blur History toggle (ON/OFF)

**Progress & Growth** (visible only if gamification ON):
- XP progress bar (cyan-to-indigo gradient)
- Level display + XP count
- Stats grid: Day Streak, Total Entries
- Achievements grid (trophy icons with titles)

**Backup & Restore:**
- Export button: Downloads JSON backup file
- Import button: Uploads JSON backup, reloads app

**Help & Support:**
- Start Gamified Tutorial button
- Camera & Mic Permissions help button

**Reset Options:**
- Return to Onboarding
- Reset Stats Only
- Reset All Toggles
- Turn OFF AI

**Legal:**
- Terms of Use (downloads .txt)
- Privacy Policy (downloads .txt)
- Disclaimer (downloads .txt)

**Account:**
- Switch User / Logout (returns to onboarding)

**Footer:** App version number and build date

---

## Pack System (Feature Gating)

Modular feature system. Core features always available; optional packs can be enabled/disabled.

**Core Pack** (always enabled):
- Quick Capture (text, audio, photo)
- Reflection prompts
- Archive & Search
- Export (PDF/ZIP)
- Settings & Privacy Screen

**Wellbeing Pack:**
- BioRhythm breathing exercises
- Grounding techniques (5-4-3-2-1)

**AI Reflection Coach Pack:**
- Oracle AI chat assistant
- AI-generated reflection prompts

**Scenario Practice Pack:**
- Holodeck interactive scenarios
- Decision-tree practice

**Professional Development Pack:**
- CPD time tracking
- Professional document export
- Revalidation portfolio support
- Standards mapping reference

**Reports Pack:**
- Reflection analytics
- Mood trends
- Activity reports

**Pack Browser:** Shows all optional packs with descriptions, feature lists, and enable/disable buttons. Trial system supports 7-day free trials and permanent enabling.

---

## BioRhythm (Breathing Exercises)

Guided breathwork with animated visualization.

- **10 breathing patterns:** Coherent, Box, 4-7-8 Relax, Triangle, 7-11, Physiological Sigh, Energy, Long Exhale, Equal 5, Held Release
- **Session lengths:** 2, 5, or 10 minutes
- **Visual:** Central orb that scales up/down with breath phases, color-coded (cyan=inhale, indigo=exhale, purple=hold)
- **Display:** Phase name ("Breathe In"/"Hold"/"Breathe Out"), phase timer, session timer
- **Controls:** Pattern selector, session length selector, Start/Stop button

---

## Grounding (5-4-3-2-1 Exercise)

Sensory awareness grounding technique:

1. **5 things you can SEE** (eye icon, blue)
2. **4 things you can TOUCH** (hand icon, green)
3. **3 things you can HEAR** (ear icon, purple)
4. **2 things you can SMELL** (coffee icon, orange)
5. **1 thing you can TASTE** (smile icon, pink)

Each step shows large background number, instruction text, and "I've found them" button. Completion screen shows "You are here" with checkmark.

---

## Oracle (AI Chat)

AI-powered pattern analysis using recent entries:

- Text input for questions (e.g., "What have I been writing about lately?")
- Loads last 40 entries for context
- Uses Gemini AI or offline fallback
- Shows AI response with disclaimer
- Warning banner about AI limitations (not for clinical decisions)
- Footer: "Uses only your local entries • No data sent to cloud"

---

## Holodeck (Scenario Practice)

Interactive scenario-based learning:

- Hub view listing available scenario spaces
- Active space view for immersive scenario experience
- Sessions tracked and counted toward CPD hours
- Entries saved to localStorage

---

## CPD Tracking

Professional development portfolio:

- **Regulatory standard selector** (NMC for nursing, GMC for doctors, HCPC, GPhC, etc.)
- **Progress bar** showing hours completed vs. annual requirement
- **Category breakdown** with colored bars (Clinical Practice, Communication, Leadership, etc.)
- **Gap analysis** showing missing categories
- **Manual record entry** with: title, category, hours, date, description, evidence type, learning outcomes
- **Auto-mapping** from reflection models to CPD categories (e.g., GIBBS reflections = Clinical Practice hours)
- **CSV export** of all CPD records
- **Regulatory disclaimer** throughout

---

## Professional Document Export

Generate formal documents for regulatory bodies:

- **Templates:** NMC Reflective Account, GMC Appraisal, HCPC Profile, and others
- **Entry selection** checklist (reflections only)
- **Word limit** option
- **Generated document** in formatted text
- **Copy to clipboard** or **Download as .txt**
- **AI warning:** "You MUST review, edit, and verify all generated content before submission"

---

## Reports & Analytics

Date-range statistics:

- **Summary cards:** Total entries, average mood, daily average, active days
- **Reflection model usage** breakdown with horizontal bars and percentages
- **Export:** CSV and Text report downloads

---

## Calendar View

Visual entry timeline with 3 modes:

- **Month view:** 7-column grid, color-coded days by mood/activity level, entry counts
- **Year view:** 12 mini-month heatmaps
- **Day view:** List of entries for selected day, clickable to open detail
- **Color scale:** Gray (none) → Rose (incident) → Amber → Yellow → Emerald → Teal (high mood)

---

## Crisis Protocols

Read-only emergency reference guide:

- **28+ protocols** across 8 categories: Immediate Safety, Mental Health, Clinical, Security, Fire/HazMat, Cyber/Data, Operational, Communication
- **Search** across all protocol content
- **Category filter** buttons
- **Expandable cards** with numbered steps and notes
- Examples: Evacuation, Lockdown, Suicide/Self-Harm, Cardiac Arrest, FAST Stroke, Active Threat, Cybersecurity Breach

---

## Guardian Safety System

Real-time text analysis in Quick Capture:

- **High-risk signals** (suicide, self-harm, overdose, etc.) → RED alert with:
  - "This sounds urgent. Please don't carry it alone."
  - Samaritans: 116 123 (24/7, free)
  - Shout: text 'SHOUT' to 85258
  - NHS urgent: call 111, option 2
- **Medium-risk signals** (panic, hopeless, worthless, etc.) → AMBER alert with:
  - Breathing exercise suggestion
  - Reach out to someone prompt
  - Small next step suggestion

Runs offline, no AI needed. Keyword-matching only.

---

## Privacy & Security

- **Privacy Lock:** PIN protection for app access
- **Blur History:** Blurs entry content in Archive/Calendar views
- **Auto-Lock timer:** Configurable (5min, 15min, 30min, 1hr, never)
- **PIN for export:** Optional requirement
- **All data local:** No server, no cloud sync, no telemetry

---

## Gamification (Optional)

When enabled:

- **XP system:** Points earned for reflections, captures, completing exercises
- **Levels:** Progress through levels with increasing XP thresholds
- **Streaks:** Consecutive days with entries
- **Achievements:** Unlockable badges (e.g., "First Reflection", model-specific badges)
- **Tutorial:** 19-step gamified walkthrough awarding XP per step

---

## Profession System

30+ profession configurations. Each profession defines:

- **Display label and description**
- **AI prompt prefix** (tailored to profession context)
- **Allowed reflection models** (e.g., nurses get GIBBS, SBAR; doctors get SOAP, STAR)
- **Regulatory standards** (e.g., NMC Code for nursing with 25 standards across 4 categories: Prioritise People, Practise Effectively, Preserve Safety, Promote Professionalism)

Healthcare professions: Nursing, Medical, Paramedic, Mental Health, Social Work, Pharmacy, Dentistry, Allied Health, Emergency Services

Other professions: Education (Primary/Secondary/Higher), Social Care, Youth Work, Legal, Business, Finance, Engineering, Technology, Leadership, Other

Selected during onboarding, affects: reflection prompts, CPD standards, document templates, AI context.

---

## Data Model

**Entry types:**
- `ReflectionEntry`: model, answers (keyed by stage ID), mood (1-5), CPD log, AI insights, NMC code themes
- `IncidentEntry`: notes (free text), media attachments (photo/audio/video), guardian badge, severity, category

**Media storage:** Photos as data URLs (base64), audio in IndexedDB (idb:// paths resolved via readMediaFile())

**Persistence:** All entries in localStorage as JSON array. Profile in localStorage as JSON object. Stats in localStorage. Pack state in localStorage.

---

## Current Testing Configuration

- **Offline-only:** No Gemini API key shipped, OfflineProvider generates daily prompts
- **PWA distribution:** No APK, accessed via browser URL
- **UK-only crisis resources:** Samaritans, Shout, NHS 111
- **Default profession:** NURSING
- **AI toggle:** OFF by default
- **Gamification:** OFF by default
- **Features cut for testing:** Canvas Board, Video Capture, Mental Atlas orbital view, full gamification, Drive Mode
