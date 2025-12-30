# REFLEXIA APP - COMPLETE CLAUDE CODE HANDOFF
## Master Implementation Plan

---

## 📊 PROJECT OVERVIEW

**What This Is:**
A professional-grade reflection journaling app for healthcare professionals and personal use. Offline-first, privacy-focused, depth over features, calm over gamification.

**Current State:** ~40% complete
- Core architecture ✅
- Type system ✅  
- Basic reflection flow ✅
- Many features partially implemented
- Some features broken
- Many features missing entirely

**Target State:** 100% production-ready
- All 21 core systems fully implemented
- All 20 Holodeck spaces functional
- Complete media capture (photo/video/audio)
- Professional CPD mapping
- Mental Atlas pattern detection
- Full offline capability
- Zero console errors
- Clean, polished UX

---

## 📦 WHAT YOU'RE RECEIVING

### Completed & Ready to Deploy:
1. **ReflectionFlow_IMPROVED.tsx** - Cleaner framework selector
2. **Guide_IMPROVED.tsx** - Glowing orb design
3. **guide_IMPROVED.css** - Enhanced animations
4. **types.ts** - Comprehensive type system
5. **AI Service Layer** - Offline-first architecture (aiProvider, aiService, providers/)
6. **index.css** - Tailwind + animations

### Reference Documents:
1. **HOLODECK_SPECIFICATION.md** - 20 guided spaces (detailed prompts, rules, structure)
2. **COMPLETE_FEATURE_INVENTORY.md** - All 21 systems with full requirements
3. **CLAUDE_CODE_TRANSITION_PLAN.md** - Phase-by-phase roadmap
4. **IMPROVEMENT_SUMMARY.md** - Quick wins & known issues

### Project Files:
- Full React + TypeScript + Vite codebase
- All components (some complete, some partial, some broken)
- All services (some complete, some stubbed)
- All constants & data files

---

## 🎯 THE 21 CORE SYSTEMS

Based on complete feature inventory:

### ✅ COMPLETE (5 systems)
1. **Identity & User Context** - Name-based, local-first profile
2. **Onboarding Flow** - Name + profession selection
3. **Navigation** - Bottom nav + tools menu
4. **Type System** - Comprehensive, backward-compatible
5. **AI Layer** - Offline-first provider pattern

### ⚠️ PARTIAL / BROKEN (8 systems)
6. **Reflection Models** - Basic stages work, missing features
7. **Quick Capture** - TEXT/DRAW only, needs PHOTO/VIDEO/AUDIO
8. **Calendar & History** - Basic, needs filters/search
9. **BioRhythm** - Works, needs visual timer
10. **Gamification** - XP display only, needs progression
11. **Privacy Controls** - Basic, needs entry locking
12. **Drive Mode** - UI exists, BROKEN interaction
13. **Holodeck** - 3 basic spaces, needs 17 more

### ❌ MISSING (8 systems)
14. **Media System** - Camera/video/audio capture
15. **Mental Atlas** - Pattern detection (empty component exists)
16. **Library** - Learning resources (stub only)
17. **Professional CPD** - Mapping & export (partial)
18. **Archive/Search** - Filtering & search
19. **Grounding Mode** - Breath prompts (basic exists)
20. **Data Export** - Reflection/CPD export
21. **Incident Mode** - Factual timestamped capture

---

## 🚀 EXECUTION STRATEGY

### Phase Structure:
Each phase = **Focused deliverable** with clear success criteria

### Working Style:
1. Read/understand existing code FIRST
2. Implement changes incrementally
3. Test compilation after each file
4. Verify functionality where possible
5. Move to next task
6. Regular check-ins for feedback

---

## 📅 PHASE BREAKDOWN (12 Phases)

### **PHASE 0: Setup & Quick Wins** (1 hour)
**Goal:** Deploy improvements, verify baseline

**Tasks:**
1. Deploy 3 improved files (ReflectionFlow, Guide, guide.css)
2. Run `npm install && npm run dev`
3. Verify no compilation errors
4. Test basic navigation
5. Confirm starting point

**Success Criteria:**
- ✅ App compiles
- ✅ App runs
- ✅ Visual improvements visible
- ✅ No console errors on startup

---

### **PHASE 1: Critical Fixes** (3 hours)
**Goal:** Fix broken features

#### 1.1 Drive Mode Interaction
**Current:** UI renders, clicks don't work
**Fix:** Debug event handlers, enable voice capture, verify auto-lock

**Files:**
- `src/components/DriveMode.tsx`

**Tests:**
- Can start Drive Mode from Tools menu
- Can tap to capture voice
- Motion lock works
- Auto-save triggers
- Exit returns to home

#### 1.2 Neural Link Logout
**Current:** No way to return to onboarding
**Add:** "Return to Login" / "Switch User" button

**Files:**
- `src/components/NeuralLink.tsx`
- `src/App.tsx` (add handler to reset user state)

**Tests:**
- Button appears in Neural Link
- Click returns to onboarding
- Profile data clears (or switches)

#### 1.3 BioRhythm Visual Timer
**Current:** Text timer exists but not prominent
**Add:** Large circular progress indicator

**Files:**
- `src/components/BioRhythm.tsx`

**Design:**
- SVG circle around Guide orb
- Animated stroke-dasharray
- Color-coded by phase (inhale=cyan, exhale=purple, hold=yellow)
- Shows countdown visually

**Tests:**
- Circular timer renders
- Syncs with phase countdown
- Colors change per phase
- Animation smooth

**Success Criteria:**
- ✅ Drive Mode fully interactive
- ✅ Neural Link has logout
- ✅ BioRhythm has visual timer

---

### **PHASE 2: Media Capture System** (6 hours)
**Goal:** Complete media capture infrastructure

#### 2.1 Create Media Service
**Create:** `src/services/mediaService.ts`

**Functions:**
- `requestCameraAccess()` → MediaStream
- `capturePhoto(stream)` → Blob
- `startVideoRecording(stream)` → MediaRecorder
- `stopVideoRecording(recorder)` → Blob  
- `startAudioRecording()` → MediaRecorder
- `stopAudioRecording(recorder)` → Blob
- `generateThumbnail(videoBlob)` → string
- `compressImage(blob, quality)` → Blob

#### 2.2 Create Capture Components
**Create:**
- `src/components/media/CameraCapture.tsx`
  - Video preview
  - Capture button
  - Flip camera
  - Flash toggle
  - Preview captured image
  - Retake / Use

- `src/components/media/VideoCapture.tsx`
  - Video preview  
  - Record button (shows timer)
  - Stop recording
  - Preview playback
  - Retake / Use

- `src/components/media/AudioCapture.tsx`
  - Waveform visualization
  - Record button
  - Timer display
  - Stop button
  - Preview playback
  - Retake / Use

#### 2.3 Update Quick Capture
**Transform:** `src/components/QuickCapture.tsx`

**From:** TEXT + DRAW tabs
**To:** TEXT + PHOTO + VIDEO + AUDIO + DRAW tabs

**Integration:**
- Import media components
- Add tab state handling
- Pass captured media to save handler
- Update guardian check to run on text only

**Tests:**
- All 5 tabs render
- Camera opens and captures
- Video records and previews
- Audio records and plays back
- Drawing works (already done)
- Text entry works (already done)
- Can save any combination
- Media appears in entry history

**Success Criteria:**
- ✅ mediaService.ts complete
- ✅ All 3 capture components work
- ✅ QuickCapture has 5 functional tabs
- ✅ Media saves to entries
- ✅ Thumbnails generate

---

### **PHASE 3: Holodeck - 20 Guided Spaces** (12 hours)
**Goal:** Implement all 20 spaces per HOLODECK_SPECIFICATION.md

#### 3.1 Architecture
**Create:**
```
src/components/holodeck/
├── HolodeckHub.tsx          # Space selector grid
├── HolodeckSpace.tsx        # Generic container
├── types.ts                 # Space types
└── spaces/
    ├── DifficultConversation.tsx
    ├── DecisionSpace.tsx
    ├── [... 18 more ...]
    └── ReAnchoring.tsx

src/data/
└── holodeckSpaces.ts        # Space definitions & prompts
```

#### 3.2 Space Template Pattern
Each space follows this structure:
```typescript
// Example: DifficultConversation.tsx
export default function DifficultConversation({ onExit, onSave }) {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const prompts = HOLODECK_SPACES.difficultConversation.prompts;

  return (
    <HolodeckSpace
      title="Difficult Conversation"
      purpose="Prepare for a real conversation before it happens"
      currentPrompt={prompts[currentPrompt]}
      answer={answers[currentPrompt] || ''}
      onAnswer={(text) => updateAnswer(currentPrompt, text)}
      onNext={() => advance()}
      onExit={onExit}
      onSave={() => saveEntry()}
      guideState="idle"
      progress={currentPrompt / prompts.length}
    />
  );
}
```

#### 3.3 Implementation Priority
**Week 1 (First 10 spaces):**
1. Difficult Conversation ⭐ High use
2. Decision Space ⭐ High use
3. Emotional Processing ⭐ High use
4. Role Reversal
5. Performance Rehearsal
6. Values Clarification ⭐ High use
7. Identity Space
8. Compassion Space ⭐ High use
9. Guided Stillness
10. Gratitude Space

**Week 2 (Final 10 spaces):**
11. Loss & Letting Go
12. Fear Exploration
13. Conflict De-escalation
14. Forgiveness Space
15. Purpose & Direction
16. Boundary-Setting ⭐ High use
17. Inner Dialogue
18. Re-Anchoring ⭐ High use
19. Crisis Rewind ⚠️ (Safety critical)
20. Creative Ideation

#### 3.4 Quality Checklist Per Space
- [ ] Purpose statement displayed
- [ ] All prompts written
- [ ] User can answer each prompt
- [ ] Guide visual state changes
- [ ] Progress indicator shows
- [ ] Exit button always visible
- [ ] Can exit at any point
- [ ] Optional save works
- [ ] No fantasy/role-play
- [ ] Works offline
- [ ] No forced progression

**Success Criteria:**
- ✅ All 20 spaces implemented
- ✅ HolodeckHub selector works
- ✅ Each space follows template
- ✅ Safety guardrails enforced
- ✅ Exit/save work correctly
- ✅ Guide responds appropriately

---

### **PHASE 4: Mental Atlas** (8 hours)
**Goal:** Pattern detection from reflection history

#### 4.1 Create Analysis Service
**Create:** `src/services/mentalAtlasService.ts`

**Functions:**
- `extractKeywords(text)` → string[]
- `buildCooccurrenceMap(entries)` → Map<string, string[]>
- `detectThemes(entries)` → Theme[]
- `findPatterns(entries, timeframe)` → Pattern[]
- `generateClusters(keywords)` → Cluster[]

**Algorithm:**
- Simple keyword extraction (frequency-based)
- Co-occurrence within same entry
- Temporal grouping (same keywords over time)
- No ML required (deterministic)

#### 4.2 Update Mental Atlas Component
**Enhance:** `src/components/MentalAtlas.tsx`

**UI:**
- Visual network/terrain view
- Interactive keyword clusters
- Timeline of theme emergence
- Temporal patterns
- No scoring/judgment

**Views:**
- Map view (network graph)
- Timeline view (themes over time)
- Cluster view (grouped keywords)
- Search/filter

**Tests:**
- Loads entries and analyzes
- Shows keyword clusters
- Visualizes co-occurrence
- Timeline shows patterns
- No analysis = empty state message
- Works offline

**Success Criteria:**
- ✅ Pattern detection works
- ✅ Visualization renders
- ✅ Timeline shows emergence
- ✅ No scoring/judgment
- ✅ Read-only insights

---

### **PHASE 5: Library & Learning** (4 hours)
**Goal:** Curated learning resources

#### 5.1 Create Resources Data
**Create:** `src/data/learningResources.ts`

**Structure:**
```typescript
interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'exercise' | 'prompt' | 'framework';
  tags: string[];
  content: string; // Offline content
  relatedTo?: string[]; // Entry types
}
```

**Resources:**
- Reflection framework guides
- Grounding exercises
- CPD guidance
- Emotional regulation
- Professional standards info

#### 5.2 Update Library Component
**Enhance:** `src/components/Library.tsx`

**Features:**
- Search & filter
- Tag-based browsing
- Bookmark favorites
- Link to related entries
- Offline-first

**Tests:**
- Resources load
- Search works
- Filter by tags
- Bookmarks persist
- Links to entries work

**Success Criteria:**
- ✅ 30+ resources available
- ✅ Search functional
- ✅ Bookmarks work
- ✅ Fully offline

---

### **PHASE 6: Professional CPD** (6 hours)
**Goal:** Complete CPD mapping & export

#### 6.1 CPD Service
**Enhance:** `src/services/cpdService.ts`

**Functions:**
- `mapReflectionToStandards(entry, profession)` → Mapping[]
- `calculateCPDHours(entries, period)` → number
- `generateCPDReport(entries, period)` → Report
- `exportCPDLog(entries, format)` → Blob

#### 6.2 Competency Matrix
**Enhance:** `src/components/CompetencyMatrix.tsx`

**Add:**
- Interactive grid
- Standards mapping
- Progress visualization
- Export to PDF

#### 6.3 Export System
**Create:** `src/services/exportService.ts`

**Functions:**
- `exportReflections(entries, format)` → Blob
- `exportCPDLog(entries, profession, period)` → Blob
- `exportBackup(allData)` → Blob
- `importBackup(blob)` → Data

**Formats:**
- PDF (reflections, CPD logs)
- JSON (backup/restore)
- CSV (CPD hours)

**Tests:**
- Reflections export to PDF
- CPD log exports
- Backup creates JSON
- Restore from backup works

**Success Criteria:**
- ✅ CPD hours calculated
- ✅ Standards mapped
- ✅ Export works (PDF, JSON, CSV)
- ✅ Backup/restore functional

---

### **PHASE 7: Enhanced Reflection** (4 hours)
**Goal:** Complete reflection features

#### 7.1 Add Missing Features
**Update:** `src/components/ReflectionFlow.tsx`

**Add:**
- Attachment management (photos from camera)
- Better progress saving
- Offline sync status
- Stage validation (optional)

#### 7.2 Incident Mode
**Create:** `src/components/IncidentMode.tsx`

**Features:**
- Factual timestamped capture
- Location (optional)
- Media attachments
- Guardian prompts
- Can convert to reflection

**Success Criteria:**
- ✅ All reflection models work
- ✅ Media attachments in reflections
- ✅ Incident mode functional
- ✅ Conversion works

---

### **PHASE 8: Privacy & Security** (3 hours)
**Goal:** Entry-level privacy controls

#### 8.1 Privacy Service
**Create:** `src/services/privacyService.ts`

**Functions:**
- `lockEntry(entryId, pin)` → boolean
- `unlockEntry(entryId, pin)` → boolean
- `blurEntry(entryId)` → void
- `unblurEntry(entryId)` → void

#### 8.2 Update Components
**Enhance:**
- `src/components/CalendarView.tsx` - Add blur support
- `src/components/PrivacyLock.tsx` - Full implementation
- Entry detail modals - Add lock/unlock UI

**Tests:**
- Can lock individual entries
- PIN required to view locked entry
- Blurred entries show placeholder
- App lock works

**Success Criteria:**
- ✅ Entry locking works
- ✅ Blur in calendar
- ✅ App-level lock
- ✅ Privacy maintained

---

### **PHASE 9: Archive & Search** (4 hours)
**Goal:** Enhanced history management

#### 9.1 Search System
**Create:** `src/services/searchService.ts`

**Functions:**
- `searchEntries(query, filters)` → Entry[]
- `filterByType(entries, type)` → Entry[]
- `filterByDateRange(entries, start, end)` → Entry[]
- `filterByMood(entries, mood)` → Entry[]
- `filterByMedia(entries, hasMedia)` → Entry[]

#### 9.2 Archive Component
**Create:** `src/components/Archive.tsx`

**Features:**
- Search bar
- Filter panel
- Sort options
- Pagination
- Export selected

**Success Criteria:**
- ✅ Full-text search works
- ✅ Filters functional
- ✅ Sorting works
- ✅ Export selection

---

### **PHASE 10: Grounding Mode** (2 hours)
**Goal:** Enhanced wellbeing tools

#### 10.1 Grounding Exercises
**Enhance:** `src/components/Grounding.tsx`

**Add:**
- 5-4-3-2-1 technique
- Body scan
- Safe place visualization
- Breath focus
- Immediate exit to Crisis Protocols

**Success Criteria:**
- ✅ 5+ grounding exercises
- ✅ Visual guidance
- ✅ No logging required
- ✅ Quick exit to Crisis

---

### **PHASE 11: Gamification** (4 hours)
**Goal:** Complete progression system

#### 11.1 Gamification Service
**Enhance:** `src/services/gamificationService.ts`

**Functions:**
- `calculateXP(action)` → number
- `checkLevelUp(currentXP)` → { levelUp: boolean, newLevel: number }
- `unlockAchievement(id)` → Achievement
- `calculateStreak(entries)` → number (no punishment)

#### 11.2 Update Hub
**Enhance:** `src/components/GamificationHub.tsx`

**Add:**
- XP breakdown
- Level progression visual
- Achievement unlock animations
- Streak display (encouraging, not guilt)
- Disable toggle

**Success Criteria:**
- ✅ XP earned from actions
- ✅ Level progression works
- ✅ Achievements unlock
- ✅ Fully disableable
- ✅ No guilt mechanics

---

### **PHASE 12: Polish & Testing** (6 hours)
**Goal:** Production-ready quality

#### 12.1 UX Refinements
- Accessibility audit (keyboard nav, ARIA labels)
- Touch target sizes (minimum 44x44px)
- Loading states everywhere
- Error states with recovery
- Empty states with guidance
- Animation polish (smooth, purposeful)
- Dark mode consistency
- Typography hierarchy

#### 12.2 Comprehensive Testing
**Test Every View:**
- Onboarding → Dashboard
- Reflect → All 9 models
- Quick Capture → All 5 tabs
- Calendar → Month/Year/Day
- Holodeck → All 20 spaces
- Mental Atlas → Pattern detection
- Library → Search & browse
- BioRhythm → Timer works
- Grounding → All exercises
- Oracle → Q&A
- Crisis Protocols → All protocols
- Drive Mode → Voice capture
- Neural Link → Settings work
- Archive → Search works
- Gamification → XP/levels work

**Verify:**
- [ ] Zero TypeScript errors
- [ ] Zero console errors
- [ ] No React warnings
- [ ] All navigation works
- [ ] All media types work
- [ ] Offline mode complete
- [ ] Local storage works
- [ ] Export functions work
- [ ] Privacy controls work
- [ ] Performance acceptable

**Success Criteria:**
- ✅ All views functional
- ✅ No errors anywhere
- ✅ Smooth navigation
- ✅ Professional polish
- ✅ Ready for deployment

---

## 📊 TIMELINE ESTIMATE

| Phase | Hours | Days (8h/day) |
|-------|-------|---------------|
| Phase 0: Setup | 1 | 0.1 |
| Phase 1: Critical Fixes | 3 | 0.4 |
| Phase 2: Media System | 6 | 0.8 |
| Phase 3: Holodeck | 12 | 1.5 |
| Phase 4: Mental Atlas | 8 | 1.0 |
| Phase 5: Library | 4 | 0.5 |
| Phase 6: CPD | 6 | 0.8 |
| Phase 7: Reflection | 4 | 0.5 |
| Phase 8: Privacy | 3 | 0.4 |
| Phase 9: Archive | 4 | 0.5 |
| Phase 10: Grounding | 2 | 0.3 |
| Phase 11: Gamification | 4 | 0.5 |
| Phase 12: Polish | 6 | 0.8 |
| **TOTAL** | **63 hours** | **~8 days** |

**With Testing/Iteration:** Plan for **10-14 days**

---

## 🎯 SUCCESS DEFINITION

**The app is COMPLETE when:**
- ✅ All 21 core systems fully implemented
- ✅ All 20 Holodeck spaces functional
- ✅ Complete media capture (photo/video/audio/draw/text)
- ✅ Mental Atlas pattern detection working
- ✅ Professional CPD mapping & export
- ✅ Privacy controls functional
- ✅ Zero TypeScript errors
- ✅ Zero console errors
- ✅ Works completely offline
- ✅ All navigation smooth
- ✅ Production-ready UX polish

---

## 📝 HANDOFF CHECKLIST

**Files You Have:**
- [x] Complete codebase
- [x] HOLODECK_SPECIFICATION.md
- [x] COMPLETE_FEATURE_INVENTORY.txt
- [x] CLAUDE_CODE_TRANSITION_PLAN.md (this document)
- [x] IMPROVEMENT_SUMMARY.md
- [x] ReflectionFlow_IMPROVED.tsx
- [x] Guide_IMPROVED.tsx
- [x] guide_IMPROVED.css
- [x] All other completed files

**Context You Have:**
- [x] Current state analysis
- [x] Architecture decisions
- [x] Type system complete
- [x] AI layer complete
- [x] Known issues documented
- [x] Phase-by-phase plan
- [x] Success criteria clear

---

## 🚀 OPENING MESSAGE FOR CLAUDE CODE

```
Hi! I'm handing off a React + TypeScript reflection app for completion.

CURRENT STATE:
- ~40% complete, compiles, runs
- Core architecture solid (types, AI service layer)
- Several features broken or incomplete
- 3 UI improvements ready to deploy

YOUR MISSION:
Transform this from "partially working" to "production ready" through 12 systematic phases.

WHAT YOU'RE BUILDING:
- 21 core systems (5 done, 8 partial, 8 missing)
- 20 Holodeck guided simulation spaces
- Complete media capture (photo/video/audio)
- Professional CPD mapping
- Mental Atlas pattern detection
- Full offline capability
- Zero errors, polished UX

I HAVE FOR YOU:
- CLAUDE_CODE_TRANSITION_PLAN.md (this complete roadmap)
- HOLODECK_SPECIFICATION.md (20 space definitions)
- COMPLETE_FEATURE_INVENTORY.txt (all 21 systems)
- 3 improved files ready to deploy
- Complete existing codebase

LET'S START:
Phase 0 - Deploy improvements, verify baseline
Then systematically work through Phases 1-12

Ready?
```

---

## ✅ YOU'RE READY TO TRANSITION

Everything is organized, documented, and ready for Claude Code to execute systematically. Good luck! 🚀
