# HOLODECK IMPLEMENTATION SPECIFICATION
## 20 Guided Inner Simulation Spaces

---

## 🎯 CORE PRINCIPLE

**The Holodeck is guided inner simulation, NOT:**
- ❌ Fantasy role-play
- ❌ Character impersonation  
- ❌ Escapism
- ❌ Trauma reenactment
- ❌ "Winning" narratives

**It exists to:**
- ✅ Slow thought
- ✅ Create perspective
- ✅ Allow safe rehearsal
- ✅ User always in control
- ✅ Can exit at any time
- ✅ Works offline

---

## 🏗️ SPACE STRUCTURE TEMPLATE

Each space must have:
```typescript
interface HolodeckSpace {
  id: string;
  name: string;
  icon: LucideIcon;
  purpose: string;
  userActions: string[];  // What user does
  guideRole: string;      // How Guide responds
  rules: string[];        // Constraints
  prompts: string[];      // Step prompts
  exitAllowed: boolean;   // Always true
  canSave: boolean;       // Optional save
  worksOffline: boolean;  // Always true
}
```

---

## 📋 THE 20 SPACES

### 1️⃣ Difficult Conversation Space
**Purpose:** Prepare for a real conversation before it happens

**User Does:**
- Names the person
- States what they want to say
- Explores tone and outcome

**Guide Role:**
- Reflects phrasing
- Highlights risks
- Suggests calmer framing

**Rules:**
- No pretending to "win"
- Focus on clarity, not dominance

**Prompts:**
1. "Who do you need to speak with?"
2. "What do you want them to understand?"
3. "What tone feels honest but kind?"
4. "What outcome would feel okay, even if not perfect?"
5. "What might they be feeling?"

---

### 2️⃣ Decision Space
**Purpose:** Think through a decision without pressure

**User Does:**
- Lays out options
- Names fears and hopes
- Sits with uncertainty

**Guide Role:**
- Keeps options visible
- Prevents rushing

**Prompts:**
1. "What decision are you facing?"
2. "What are the options you can see?"
3. "What are you afraid might happen?"
4. "What are you hoping for?"
5. "What can wait? What can't?"

---

### 3️⃣ Emotional Processing Space
**Purpose:** Process a strong emotion safely

**User Does:**
- Names the emotion
- Describes physical sensation
- Lets it exist without solving

**Guide Role:**
- Normalizes emotion
- Prevents suppression or escalation

**Prompts:**
1. "What emotion is present right now?"
2. "Where do you feel it in your body?"
3. "What does it need to be acknowledged?"
4. "Can it exist without being solved right now?"
5. "What would help you carry this more gently?"

---

### 4️⃣ Role Reversal Space
**Purpose:** See a situation from another perspective

**User Does:**
- Describes the other person's possible view
- Acknowledges unknowns

**Guide Role:**
- Interrupts assumptions and absolutism

**Prompts:**
1. "Who's perspective are you trying to understand?"
2. "What might they be seeing that you can't?"
3. "What don't you know about their situation?"
4. "What might they be afraid of?"
5. "How might this look different to them?"

---

### 5️⃣ Performance Rehearsal
**Purpose:** Prepare for public speaking, meetings, or presentations

**User Does:**
- Walks through the event
- Names nerves and strengths

**Guide Role:**
- Grounds confidence, not hype

**Prompts:**
1. "What event are you preparing for?"
2. "What part feels most challenging?"
3. "What do you know you're good at?"
4. "What's one thing you can control?"
5. "How will you reconnect if you get lost?"

---

### 6️⃣ Crisis Rewind
**Purpose:** Revisit a difficult event without reliving trauma

**User Does:**
- Observes from distance
- Identifies turning points

**Guide Role:**
- Maintains emotional safety and pacing

**⚠️ CRITICAL SAFETY:**
- Must allow immediate exit
- No forced recall
- Observer perspective only
- Pacing controlled by user

**Prompts:**
1. "Can you name the event from a distance?"
2. "What do you notice now that you didn't then?"
3. "Where was a turning point?"
4. "What would you tell yourself then, if you could?"
5. "What do you need to put this down for now?"

---

### 7️⃣ Values Clarification Space
**Purpose:** Reconnect with personal values

**User Does:**
- Names what matters
- Notices value conflicts

**Guide Role:**
- Keeps focus on integrity, not image

**Prompts:**
1. "What matters most to you right now?"
2. "Where do you feel aligned with your values?"
3. "Where do you feel pulled away from them?"
4. "What would living by this value look like?"
5. "What small action honors what you value?"

---

### 8️⃣ Identity Space
**Purpose:** Explore "Who am I becoming?"

**User Does:**
- Reflects on roles, labels, growth

**Guide Role:**
- Prevents identity collapse or over-definition

**Prompts:**
1. "How would you describe yourself right now?"
2. "What roles do you hold? Which feel true?"
3. "What are you growing into?"
4. "What are you growing out of?"
5. "What part of you feels most 'you'?"

---

### 9️⃣ Compassion Space
**Purpose:** Extend compassion — to self or others

**User Does:**
- Names pain without judgement

**Guide Role:**
- Softens inner criticism

**Prompts:**
1. "Who needs compassion right now — you, or someone else?"
2. "What would kindness look like here?"
3. "Can you name the pain without judging it?"
4. "What would you say to a friend in this situation?"
5. "Can you offer yourself that same gentleness?"

---

### 🔟 Creative Ideation Space
**Purpose:** Generate ideas without pressure

**User Does:**
- Explores loosely
- Captures fragments

**Guide Role:**
- Protects playfulness
- Avoids evaluation

**Prompts:**
1. "What are you exploring or creating?"
2. "What ideas come up, even if messy?"
3. "What if nothing had to be perfect?"
4. "What fragment feels interesting?"
5. "What wants to emerge without forcing it?"

---

### 1️⃣1️⃣ Guided Stillness
**Purpose:** Rest the mind

**User Does:**
- Breathes
- Notices silence

**Guide Role:**
- Minimal presence only

**Prompts:**
1. "Notice your breath, without changing it"
2. "What sounds can you hear?"
3. "What's one thing you can see?"
4. "Can you rest here for a moment?"
5. [Silent pause - no prompt]

---

### 1️⃣2️⃣ Gratitude Space
**Purpose:** Restore perspective during stress

**User Does:**
- Names simple, concrete gratitudes

**Guide Role:**
- Prevents toxic positivity

**⚠️ CRITICAL:** Not forced happiness
- Honest acknowledgment only
- No minimizing pain

**Prompts:**
1. "What's one small thing that's okay right now?"
2. "What ordinary comfort can you notice?"
3. "Who or what steadied you recently?"
4. "What worked, even a little?"
5. "What can you acknowledge without dismissing difficulty?"

---

### 1️⃣3️⃣ Loss & Letting Go Space
**Purpose:** Acknowledge loss or endings

**User Does:**
- Names what was lost
- Names what remains

**Guide Role:**
- Holds space
- Does not resolve

**Prompts:**
1. "What has ended or been lost?"
2. "What did it mean to you?"
3. "What do you need to acknowledge about it?"
4. "What remains, even in the loss?"
5. "What do you need to carry forward?"

---

### 1️⃣4️⃣ Fear Exploration Space
**Purpose:** Understand fear instead of avoiding it

**User Does:**
- Names fear
- Separates signal from story

**Guide Role:**
- Keeps fear proportionate

**Prompts:**
1. "What are you afraid of?"
2. "Is this fear a signal or a story?"
3. "What's the actual risk?"
4. "What's the imagined risk?"
5. "What action would honor the signal?"

---

### 1️⃣5️⃣ Conflict De-escalation Space
**Purpose:** Lower emotional intensity after conflict

**User Does:**
- Replays conflict slowly
- Identifies escalation points

**Guide Role:**
- Encourages pause and repair

**Prompts:**
1. "What conflict are you carrying?"
2. "Where did it escalate?"
3. "What were you trying to protect?"
4. "What might repair look like?"
5. "What can you do differently next time?"

---

### 1️⃣6️⃣ Forgiveness Space
**Purpose:** Explore forgiveness without forcing it

**User Does:**
- Acknowledges harm
- Names boundaries

**Guide Role:**
- Rejects premature forgiveness

**⚠️ CRITICAL:** No forced forgiveness
- Boundaries honored
- Harm acknowledged
- Timeline respected

**Prompts:**
1. "What happened that hurt you?"
2. "What do you need to acknowledge about it?"
3. "What boundary needs to stay in place?"
4. "Is there any part of this you're ready to release?"
5. "What does forgiveness NOT require you to do?"

---

### 1️⃣7️⃣ Purpose & Direction Space
**Purpose:** Reconnect with long-term direction

**User Does:**
- Reflects on trajectory
- Notices drift or alignment

**Guide Role:**
- Keeps vision grounded

**Prompts:**
1. "What direction were you moving toward?"
2. "Where are you actually going right now?"
3. "What feels aligned? What feels off?"
4. "What small adjustment would feel truer?"
5. "What matters in the long view?"

---

### 1️⃣8️⃣ Boundary-Setting Space
**Purpose:** Clarify personal limits

**User Does:**
- Names overreach
- Practices saying no

**Guide Role:**
- Affirms self-respect

**Prompts:**
1. "Where are you feeling overextended?"
2. "What boundary would help?"
3. "What are you afraid will happen if you set it?"
4. "How can you say no clearly and kindly?"
5. "What do you need permission to protect?"

---

### 1️⃣9️⃣ Inner Dialogue Space
**Purpose:** Untangle conflicting inner voices

**User Does:**
- Names competing thoughts
- Separates fear from wisdom

**Guide Role:**
- Moderates, does not judge

**Prompts:**
1. "What voices are speaking inside you?"
2. "Which voice is fear? Which is wisdom?"
3. "What does each voice need you to hear?"
4. "Which voice aligns with your values?"
5. "What decision honors the whole of you?"

---

### 2️⃣0️⃣ Re-Anchoring Space
**Purpose:** Return to the present after overwhelm

**User Does:**
- Grounds in body, breath, environment

**Guide Role:**
- Calms and recenters

**Prompts:**
1. "Where are you right now?"
2. "What can you see around you?"
3. "What's one thing you can touch?"
4. "Can you feel your breath?"
5. "You're here. You're safe. You're present."

---

## 🔒 UNIVERSAL HOLODECK GUARDRAILS

**Every space MUST enforce:**

1. **User Control**
   - Can exit at ANY point
   - No forced progression
   - No locked states

2. **Safety**
   - No trauma reenactment
   - No fantasy escape
   - No character impersonation

3. **Honesty**
   - No "winning" narratives
   - No forced outcomes
   - Uncertainty is valid

4. **Functionality**
   - Works completely offline
   - No AI required
   - Prompts pre-written

5. **Optional Save**
   - User chooses to save
   - Not required
   - Can be discarded

---

## 💾 IMPLEMENTATION NOTES

### Space Component Structure
```typescript
// HolodeckSpace.tsx
interface SpaceProps {
  space: HolodeckSpace;
  onExit: () => void;
  onSave?: (entry: Entry) => void;
}

// Each space shows:
- Purpose statement
- Current prompt
- User input area
- Guide presence (visual only)
- Progress indicator (non-linear OK)
- Exit button (ALWAYS visible)
- Save button (optional, at end)
```

### Guide Behavior in Spaces
- Visual state changes based on space type
- Different colors per space category
- Gentle pulsing during user input
- No chat/conversation
- Prompts appear as text, not "spoken"

### Exit Behavior
- Exit button always visible
- One-tap exit (no confirmation unless user has written content)
- If content exists: "Save before leaving?"
- Returns to Holodeck hub

### Save Behavior
- Completely optional
- Appears at natural endpoint (after last prompt)
- Can save partial progress
- Saves as HolodeckEntry type

---

## 📁 FILE STRUCTURE

```
src/components/holodeck/
├── HolodeckHub.tsx          # Space selector
├── HolodeckSpace.tsx        # Generic space container
├── spaces/
│   ├── DifficultConversation.tsx
│   ├── DecisionSpace.tsx
│   ├── EmotionalProcessing.tsx
│   ├── RoleReversal.tsx
│   ├── PerformanceRehearsal.tsx
│   ├── CrisisRewind.tsx
│   ├── ValuesClarity.tsx
│   ├── IdentitySpace.tsx
│   ├── CompassionSpace.tsx
│   ├── CreativeIdeation.tsx
│   ├── GuidedStillness.tsx
│   ├── GratitudeSpace.tsx
│   ├── LossLettingGo.tsx
│   ├── FearExploration.tsx
│   ├── ConflictDeescalation.tsx
│   ├── ForgivenessSpace.tsx
│   ├── PurposeDirection.tsx
│   ├── BoundarySetting.tsx
│   ├── InnerDialogue.tsx
│   └── ReAnchoring.tsx
└── types.ts

src/data/
└── holodeckSpaces.ts        # Space definitions
```

---

## ✅ QUALITY CHECKLIST

Before any space is "complete", verify:

- [ ] Purpose clearly stated
- [ ] All prompts written and tested
- [ ] Guide role implemented
- [ ] Exit button always visible
- [ ] No forced progression
- [ ] Works offline
- [ ] Optional save functional
- [ ] Safety guardrails enforced
- [ ] No fantasy/role-play elements
- [ ] User maintains control

---

**This is not fluff.**
**This structure is why the app feels deep instead of gimmicky, calm instead of busy, and serious instead of trendy.**
