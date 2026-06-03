# NathanType vs Monkeytype — Architectural Audit Report

**Date:** 2026-06-03  
**Auditor:** Claude Sonnet 4.6  
**Scope:** Static code analysis of both codebases; no live server testing performed.

---

## 1.1 Monkeytype Architecture Overview

### Top-Level Folder Structure

```
monkeytype/
├── frontend/        React 18 + TypeScript SPA (Vite build)
├── backend/         Node.js + Express REST API (TypeScript)
├── packages/        Shared packages consumed by both frontend and backend
│   ├── schemas/     Zod schemas for User, Result, Config, etc.
│   ├── contracts/   API request/response type definitions (Zod)
│   ├── util/        Date/time, numbers, strings, trycatch utilities
│   └── funbox/      Funbox definitions and compatibility checks
├── docker/          Docker Compose configs for local dev
├── docs/            Developer and API documentation
└── turbo.json       Turborepo monorepo orchestration config
```

### Frontend vs Backend vs Shared Split

- **Frontend** (`frontend/src/ts/`): Vanilla TypeScript with a React layer for specific UI components (commandline, settings panels). The core test loop is non-React DOM manipulation. Uses Firebase Auth SDK client-side for auth tokens; all data mutations go through the backend API.
- **Backend** (`backend/src/`): Express + MongoDB (via mongoose/mongodb driver). Firebase Admin SDK for auth token verification. Redis for leaderboard caching. Anticheat module (closed-source, loaded at runtime).
- **Shared** (`packages/`): Zod schemas are the single source of truth for all data shapes. Both frontend and backend import from `@monkeytype/schemas/*` and `@monkeytype/contracts/*`.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend bundler | Vite |
| Frontend framework | TypeScript + React 18 (partial — commandline, modals) |
| Auth | Firebase Auth (client) |
| Backend framework | Express (Node.js, TypeScript) |
| Database | MongoDB (primary user/result store) |
| Cache | Redis (leaderboards, rate limiting) |
| Auth verification | Firebase Admin SDK |
| Schema validation | Zod (`@monkeytype/schemas`) |
| Monorepo tooling | Turborepo + pnpm workspaces |
| Anticheat | Closed-source module loaded at runtime |

### Auth Flow (Step by Step)

1. User clicks "sign in with Google/GitHub" in the frontend.
2. `firebase.ts → signInWithPopup()` is called with `ignoreAuthCallback = true` to suppress the normal `onAuthStateChanged` callback.
3. On success, `getAdditionalUserInfo(signedInUser)` checks `isNewUser`.
   - **New user**: `googleSignUpEvent.dispatch()` → fires an event that calls `Ape.users.createUser()` to create the backend user document first.
   - **Existing user**: calls `readyCallback(true, user)` directly and resets `ignoreAuthCallback`.
4. `readyCallback` in `auth.tsx → getDataAndInit()` calls `DB.initSnapshot()` which fetches user data from the backend API (`GET /users/`).
5. Email/password: `createUserWithEmailAndPassword` also sets `ignoreAuthCallback = true` and triggers a server-side `createUser` call before allowing the `onAuthStateChanged` callback to fire.
6. On every page load, `onAuthStateChanged` fires with the cached Firebase user, `readyCallback` loads the snapshot from the API.

**Key design decision**: Monkeytype uses `signInWithPopup` (not redirect) and **server creates the user document** via backend API — the client never writes directly to MongoDB.

### Result Save Flow (Step by Step)

1. Test ends; frontend calls `Ape.results.save(completedEvent)` — a POST to `/results`.
2. Backend `result.ts → addResult()`:
   a. Validates user isn't banned or needing name change.
   b. Validates test duration isn't too short.
   c. Validates accuracy ≥ 75% (unless `lbOptOut`).
   d. Validates object hash (`objectHash` library) to detect tampered payloads.
   e. Validates no duplicate funboxes.
   f. Validates key spacing/duration if WPM > 130 and not verified user.
   g. Checks result spacing (can't submit faster than the test duration allows).
   h. Runs anticheat `validateResult()` and `validateKeys()`.
   i. Checks for duplicate result hash.
   j. Calls `UserDAL.checkIfPb()` and `UserDAL.checkIfTagPb()` to determine PB status.
   k. Handles Discord role updates for time:60 PBs.
   l. Calls `UserDAL.updateStreak()`.
   m. Calls `calculateXp()` (see XP formula below).
   n. Optionally updates weekly XP leaderboard.
   o. Writes result document to MongoDB via `ResultDAL.addResult()`.
   p. Calls `UserDAL.incrementXp()` and `UserDAL.incrementTestActivity()`.
   q. Returns `{ isPb, tagPbs, insertedId, xp, dailyXpBonus, xpBreakdown, streak }`.
3. Frontend `db.ts → saveLocalResult()` updates the in-memory snapshot optimistically with the returned XP and streak.

### XP Calculation (Exact Formula with File Reference)

**File**: `backend/src/api/controllers/result.ts`, lines 767–884

```
baseXp = Math.round((testDuration - afkDuration) * 2)   // 2 XP per second of active typing

modifier = 1.0
  + 0.50 if accuracy === 100 (full accuracy bonus)
  + 0.25 if all non-correct charStats === 0 (corrected-everything bonus)  [mutually exclusive with full accuracy]
  + 0.50 if mode === 'quote' (real sentences bonus)
  + 0.40 if punctuation enabled (non-quote only)
  + 0.10 if numbers enabled (non-quote only)
  + funboxModifier if funboxes present (per-funbox difficultyLevel * funboxBonusConfig)
  + streakModifier = mapRange(streak, 0, maxStreakDays, 0, maxStreakMultiplier)

accuracyModifier = (acc - 50) / 50   // 0.0 at 50% acc, 1.0 at 100% acc; acc < 50 → 0 XP from base

incompleteXp = sum over incompleteTests of: max(0, (it.acc - 50) / 50) * it.seconds
             (falls back to incompleteTestSeconds directly if no per-test breakdown)

dailyBonus = if (lastResultDay !== today):
               clamp(currentTotalXp * 0.05, minDailyBonus, maxDailyBonus)

xpWithModifiers = Math.round(baseXp * modifier)
xpAfterAccuracy = Math.round(xpWithModifiers * accuracyModifier)
totalXp = Math.round((xpAfterAccuracy + incompleteXp) * gainMultiplier) + dailyBonus
```

`gainMultiplier`, `maxDailyBonus`, `minDailyBonus`, `streak.maxStreakDays`, and `streak.maxStreakMultiplier` are all server-side configuration values.

**Note**: Monkeytype XP is **server-calculated only**. The client never computes XP independently.

### Level Progression Formula

Monkeytype does **not** store a `level` field on the user document. The XP field (`xp`) accumulates the raw total and the frontend computes level display from it. There is no published level formula in the open-source codebase; the level curve is inferred client-side from total XP. The `xp` field in MongoDB is simply incremented by each result's XP grant.

### User Document Schema (MongoDB via `@monkeytype/schemas/users.ts`)

| Field | Type | Notes |
|---|---|---|
| `uid` | `string` | Firebase UID |
| `name` | `string` | Public username (1–16 chars, slug) |
| `email` | `string` | Email address |
| `addedAt` | `number` | Unix ms, set once on creation |
| `personalBests` | `PersonalBests` | Nested: `{ time: {}, words: {}, quote: {}, zen: {}, custom: {} }` — each key maps to an array of `PersonalBest` (allows multiple PBs per mode for different configs: punctuation, difficulty, language) |
| `completedTests` | `number?` | Incremented server-side |
| `startedTests` | `number?` | Incremented server-side |
| `timeTyping` | `number?` | Cumulative seconds |
| `streak` | `UserStreak?` | `{ length, maxLength, lastResultTimestamp, hourOffset? }` |
| `xp` | `number?` | Cumulative raw XP total |
| `discordId` | `string?` | Linked Discord account |
| `discordAvatar` | `string?` | Discord avatar hash |
| `tags` | `UserTag[]?` | Array of `{ _id, name, personalBests }` |
| `profileDetails` | `UserProfileDetails?` | `{ bio, keyboard, socialProfiles: { twitter, github, website }, showActivityOnPublicProfile }` |
| `customThemes` | `CustomTheme[]?` | User-saved custom themes |
| `premium` | `PremiumInfo?` | `{ startTimestamp, expirationTimestamp }` |
| `quoteRatings` | `UserQuoteRatings?` | Per-language, per-quote ratings |
| `favoriteQuotes` | `FavoriteQuotes?` | Per-language arrays of quote IDs |
| `lbMemory` | `UserLbMemory?` | Last known leaderboard positions |
| `allTimeLbs` | `AllTimeLbs` | All-time leaderboard best ranks |
| `inventory` | `UserInventory?` | `{ badges: Badge[] }` |
| `banned` | `boolean?` | Auto-ban flag |
| `lbOptOut` | `boolean?` | Leaderboard opt-out |
| `verified` | `boolean?` | Trusted/verified user (bypasses some anticheat) |
| `needsToChangeName` | `boolean?` | Forces name change before next result |
| `quoteMod` | `QuoteMod?` | Admin flag for quote moderation |
| `resultFilterPresets` | `ResultFilters[]?` | Saved result filter presets |
| `testActivity` | `CountByYearAndDay?` | `{ [year]: number[] }` — per-day test count |
| `lastReultHashes` | `string[]?` | Recent result hashes for duplicate detection (typo in field name is intentional — it's in the DB) |
| `lbPersonalBests` | `LbPersonalBests?` | Leaderboard-specific PBs (separate from regular PBs to allow lb opt-out) |

**PersonalBest schema** (`packages/schemas/src/shared.ts`, line 10):
```typescript
{ acc, consistency, difficulty, lazyMode?, language, punctuation?, numbers?, raw, wpm, timestamp }
```
Note: Monkeytype PBs are **arrays** (multiple PBs per mode key, differentiated by difficulty/language/punctuation). NathanType stores only a single entry per mode key.

### Personal Bests Structure

`personalBests.time["60"]` is an **array** of `PersonalBest` objects — one entry per unique combination of `{ language, difficulty, punctuation, numbers, lazyMode }`. When checking a new PB, the backend calls `UserDAL.checkIfPb()` which finds the matching entry by config and compares WPM.

### Streak Logic

**File**: `backend/src/dal/user.ts`, lines 1124–1157

```typescript
if (isYesterday(lastResultTimestamp, hourOffset)):
  streak.length += 1
else if (!isToday(lastResultTimestamp, hourOffset)):
  streak.length = 1   // reset (streak broken)
// if isToday: no change (already typed today)

if (streak.length > streak.maxLength):
  streak.maxLength = streak.length

streak.lastResultTimestamp = timestamp
```

`isToday` and `isYesterday` use the `@monkeytype/util/date-and-time` UTC-offset-aware helpers, respecting `streak.hourOffset` (user-configured timezone offset, range -11 to +12 in 0.5-step increments).

---

## 1.2 NathanType Architecture Overview

### Top-Level Folder Structure

```
NathanType/
├── src/
│   ├── App.tsx           Root layout, routing, modal orchestration
│   ├── firebase.ts       Firebase SDK init (Auth + Firestore)
│   ├── context/          AuthContext.tsx — auth state + Firestore profile listener
│   ├── components/       All UI components (Auth, Results, Account, etc.)
│   ├── pages/            Route-level pages (Home, Account, Friends, etc.)
│   ├── stores/           Zustand stores (testStore, userStore, settingsStore)
│   ├── hooks/            useTypingTest, useTestResults
│   ├── utils/            firestoreService, calculateStats, saveQueue, etc.
│   ├── data/             levels, themes, content data (books, memes, lyrics)
│   ├── types/            TypeScript interfaces (index.ts)
│   └── services/         appleMusic.ts (Apple Music integration stub)
├── firestore.rules       Firestore security rules
├── package.json          npm dependencies
└── vite.config.ts        Vite build config
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3 + CSS custom properties (theme variables) |
| State management | Zustand 5 (with `persist` middleware) |
| Database | Firebase Firestore (direct client writes) |
| Auth | Firebase Auth (client SDK) |
| Charts | Recharts 3 |
| Notifications | react-hot-toast |
| Routing | React Router DOM 7 |
| Sound | Howler.js |
| No backend | All logic runs client-side; Firestore rules enforce access control |

### Auth Flow (Step by Step)

1. User opens `AuthModal` → `GoogleButton` or `GitHubButton`.
2. `signInWithPopup(auth, provider)` is called directly in the component.
3. `onAuthStateChanged` in `AuthContext.tsx` fires.
4. Context reads `localStorage` for a cached `UserProfile` and serves it immediately.
5. `onSnapshot(userRef)` is subscribed to `users/{uid}`.
6. On first snapshot resolve:
   - If `snap.exists()`: profile is loaded and cached to `localStorage`.
   - If `!snap.exists()` AND `!snap.metadata.fromCache`: server confirmed new user → `setDoc(userRef, newProfile)` writes the initial document.
7. `loading` is set to `false` as soon as the Firebase auth state is known (before Firestore confirms).

**Key differences from Monkeytype**:
- Uses `signInWithPopup` (no redirect); popup flow is the only OAuth option.
- User document is created **client-side** (no backend). The Firestore `onSnapshot` guard (`!snap.metadata.fromCache`) prevents double-creation.
- No server-side XP calculation — all XP computed client-side in `firestoreService.ts`.

### Result Save Flow (Step by Step)

1. Test ends → `useTypingTest.ts → handleTestComplete()`.
2. `calculateAllStats()` computes WPM, raw WPM, accuracy, consistency.
3. `checkAndUpdatePersonalBest()` updates the Zustand `userStore` in-memory PB map (local only — separate from Firestore PBs).
4. `computeXpResult()` called immediately with current `userProfile.xp` to produce an `XpResult` for instant UI display.
5. `useTestStore.getState().setXpResult(xpResult)` — results screen shows XP instantly.
6. `saveTestResult()` fires in the background (no `await`):
   - Opens a Firestore `runTransaction`.
   - Reads the user doc inside the transaction.
   - Recalculates XP, streak, and PBs from the fresh user doc to avoid race conditions.
   - Writes both the `testResults/{uid}/results/{id}` document and the user doc update atomically.
7. On transaction success, `invalidateTestResultsCache(uid)` clears the 60-second in-memory cache.
8. On transaction failure, `queueFailedSave()` writes to `localStorage` for retry on next login.

### XP System

**File**: `src/utils/firestoreService.ts`, lines 27–56

```
rawBase = Math.round(timeElapsed * 2)   // 2 XP per second
accuracyMod = max(0, (accuracy - 50) / 50)   // 0.0 at 50% acc, 1.0 at 100%

modifierBonus = 0
  + 0.50 if accuracy === 100 (perfect accuracy)
  + 0.50 if mode === 'quote'
  + 0.40 if punctuation (non-quote)
  + 0.10 if numbers (non-quote)
  + 0.30 if mode === 'meme' or 'content'

fullModifier = 1 + modifierBonus
total = max(1, Math.round(rawBase * fullModifier * accuracyMod))
```

**Differences from Monkeytype**:
- No daily login bonus.
- No streak XP multiplier (field is hardcoded to 0 in the breakdown).
- No incomplete test XP.
- No funbox difficulty-level multiplier.
- No server-side `gainMultiplier` config.
- Adds a `meme`/`content` mode bonus (+0.30) that Monkeytype doesn't have.

### Level Progression Formula

**File**: `src/data/levels/levels.ts`, lines 42–53

```typescript
// Level from cumulative total XP:
level = max(1, floor((sqrt(392 * totalXp + 22801) - 53) / 98))

// XP required to complete level N (not cumulative):
levelMaxXp(N) = 49 * (N - 1) + 100    // level 1 = 100 XP, level 2 = 149, etc.

// Cumulative XP needed to REACH level N:
totalXpToReachLevel(N) = round((49 * N^2 + 53 * N - 102) / 2)
```

This is a quadratic curve (roughly 100 XP at level 1, scaling linearly per level with a +49 XP step increment). The `xp` field stored in Firestore is the **cumulative total** — not the within-level XP. The `level` and `xpToNextLevel` fields are derived from it and written as denormalized convenience fields.

### User Document Schema (Firestore `users/{uid}`)

| Field | Type | Notes |
|---|---|---|
| `displayName` | `string` | From Firebase Auth or email prefix |
| `username` | `string` | Chosen username (may be empty until set) |
| `email` | `string` | Firebase Auth email |
| `photoURL` | `string \| null` | Avatar URL |
| `provider` | `'google' \| 'github' \| 'email'` | Auth provider used at creation |
| `addedAt` | `number` | Unix ms, written once at account creation |
| `createdAt` | `number?` | Legacy alias; never written after migration |
| `level` | `number` | Denormalized from `xp`; written on each result |
| `xp` | `number` | Cumulative total XP |
| `xpToNextLevel` | `number` | Denormalized; XP needed to finish current level |
| `startedTests` | `number` | Incremented when first char typed |
| `completedTests` | `number` | Incremented on each saved result |
| `timeTyping` | `number` | Cumulative seconds typed |
| `streak` | `{ length, maxLength, lastResultTimestamp }` | Monkeytype-style nested object |
| `personalBests` | `{ time: {[mode2]: PBEntry}, words: {[mode2]: PBEntry} }` | One entry per mode key (not array) |
| `friends` | `{ uid, since }[]` | Array of friend objects |
| `preferences` | `{ defaultMode, defaultTimeLimit, defaultWordLimit, streakHourOffset }` | User preferences |
| `testsStarted` | `number?` | Legacy; read via compat helper |
| `totalTests` | `number?` | Legacy; read via compat helper |
| `totalTimeTyping` | `number?` | Legacy; read via compat helper |
| `currentStreak` | `number?` | Legacy; read via compat helper |
| `bestStreak` | `number?` | Legacy; read via compat helper |
| `lastTestDate` | `number \| null?` | Legacy; read via compat helper |
| `bestWpm` | `object?` | Legacy flat PB map; read via compat helper |
| `bestWpmDates` | `object?` | Legacy PB date map; read via compat helper |

`PersonalBestEntry` shape:
```typescript
{ wpm: number, raw: number, acc: number, consistency: number, timestamp: number }
```

Firestore collections used:
- `users/{uid}` — profile document
- `usernames/{username}` — username registry (for uniqueness and lookup)
- `testResults/{uid}/results/{id}` — per-user result subcollection
- `users/{uid}/friendRequests/{fromUid}` — pending friend requests

### What's Working vs Broken/Missing

**Working:**
- Google OAuth (popup flow) with user doc creation guard
- GitHub OAuth (popup flow)
- Email/password auth with sign-up, sign-in, password reset
- Username selection and uniqueness via atomic transaction
- Firestore profile real-time listener with localStorage cache for instant load
- XP calculation (client-side) with breakdown display
- Level progression formula with tier titles
- Streak calculation (date-based, basic — no hour offset support)
- Personal bests (nested Monkeytype schema, time + words modes)
- PB detection on result screen (`isNewPersonalBest` flag)
- Test history save (atomic transaction with PB update)
- Test history display (Account page `ResultsTable` + `useTestResults` hook with 60s cache)
- Activity heatmap (last 12/6 months / 30 days from Firestore results)
- Level-up modal with confetti animation
- WPM chart on results screen (Recharts — WPM + raw WPM lines + errors bar)
- Friends system (send/accept/decline/remove friend requests via Firestore)
- Public profile page (`/profile/:username`)
- Offline save queue (localStorage retry on next login)
- Reconcile stats utility (`reconcileStats.ts`)
- Theme system (CSS custom properties, 30+ themes from `/data/themes/`)
- Funbox system (books, messages, news, history, facts, philosophy, movie-quotes, wikipedia, brainrot, gen-z, italian, characters, song lyrics, etc.)
- Settings page (behavior, appearance, sound, funbox tabs)
- ProfileDropdown with XP bar and level badge

**Broken or Incomplete:**
- `reconcileStats.ts` never accumulates `totalTimeTyping` — `let totalTimeTyping = 0` is set but never incremented, so reconciling stats **zeros out `timeTyping`**.
- `userStore.ts → updateUserStats()` references `state.user.stats.testsCompleted` etc., but the `UserProfile` type in `types/index.ts` defines a nested `stats` object that does NOT match the `UserProfile` defined in `AuthContext.tsx`. The Zustand store's `user` field is typed to `types/index.ts:UserProfile` but the actual Firestore data is `AuthContext.tsx:UserProfile`. These are two different types, creating a type mismatch that's silently ignored at runtime.
- `userStore.ts → checkAndUpdatePersonalBest()` maintains a local in-memory PB map in Zustand, which is separate from and can diverge from the Firestore `personalBests` nested schema. The `getPbKey` format (`${mode}-${timeLimit}-${wordLimit}-${punctuation}-${numbers}`) is custom and different from the Monkeytype key format (`mode2` = the number as a string).
- XP breakdown `streakBonus` is always `0` — streak multiplier not implemented in the XP formula.
- No daily XP login bonus.
- No email verification flow (no `sendEmailVerification` call anywhere).
- No account linking (can't link Google + GitHub to one account).
- `Profile.tsx` (at `/profile` route) is a legacy page that duplicates the `/account` page functionality with slightly different UI; both exist simultaneously.
- The leaderboard in `LeaderboardCard.tsx` uses a static hardcoded percentile lookup table — it is not a real leaderboard connected to any data source.
- `Callback.tsx` exists as a route but serves no purpose for popup-based auth.
- No command palette / command line (keyboard shortcut hint `⌘+shift+p` appears in `Home.tsx` UI but nothing is wired to it).

---

## 1.3 Feature Parity Matrix

| Feature | Monkeytype | NathanType | Status |
|---|---|---|---|
| **Auth** | | | |
| Google OAuth | signInWithPopup + server creates user | signInWithPopup + client creates user | ✓ parity |
| GitHub OAuth | signInWithPopup + server creates user | signInWithPopup + client creates user | ✓ parity |
| Email/password auth | Yes (sign-in + create) | Yes (sign-in + create) | ✓ parity |
| Email verification | Yes (via backend `verificationEmail` endpoint) | No implementation found | ✗ missing |
| Password reset | Yes (via backend `forgotPasswordEmail` endpoint) | Yes (`sendPasswordResetEmail` client-side) | ✓ parity |
| Account linking (multi-provider) | Yes (`linkWithPopup` in `auth.tsx`) | No implementation found | ✗ missing |
| Remember me / session persistence | Yes (user-toggled, stored in localStorage) | Firebase default (indexedDB persistence) | ⚠ partial |
| **XP & Leveling** | | | |
| XP system | Yes (server-calculated, 2 XP/sec base) | Yes (client-calculated, same 2 XP/sec base) | ⚠ partial |
| Daily login XP bonus | Yes (5% of total XP, clamped to config range) | Not implemented | ✗ missing |
| Streak XP multiplier | Yes (configurable mapRange, up to maxStreakMultiplier) | Not implemented (streakBonus always 0) | ✗ missing |
| Incomplete test XP | Yes | Not implemented | ✗ missing |
| Funbox difficulty XP bonus | Yes (per-funbox difficultyLevel * config) | Not implemented | ✗ missing |
| Corrected-everything accuracy bonus | Yes (+0.25 modifier) | Not implemented (only perfect 100% gets bonus) | ⚠ broken |
| Leveling system | Inferred from cumulative XP (no stored level) | Quadratic formula, level stored in Firestore | ⚠ partial |
| Level-up animation | Yes (badge + notification in UI) | Yes (modal with confetti) | ✓ parity |
| XP bar in navbar | Yes (profile widget) | Yes (in ProfileDropdown) | ✓ parity |
| Level badge in navbar | Yes | Yes (level number badge next to username) | ✓ parity |
| **Test Results** | | | |
| Test history save | Yes (MongoDB via backend API, anticheat validated) | Yes (Firestore, client-side atomic transaction) | ⚠ partial |
| Test history display | Yes (paginated, filterable, on account page) | Yes (last 12 months, filterable by time/mode) | ✓ parity |
| WPM over time chart | Yes (Recharts on result screen) | Yes (Recharts on result screen) | ✓ parity |
| PB notification on result screen | Yes (crown icon, `isPb` flag from server) | Yes (`isNewPersonalBest` flag from client) | ✓ parity |
| Personal bests (time modes) | Yes (15, 30, 60, 120 seconds, per config array) | Yes (15, 30, 60, 120 — single entry per key) | ⚠ partial |
| Personal bests (word modes) | Yes (10, 25, 50, 100 words) | Yes (10, 25, 50, 100) | ✓ parity |
| PB per difficulty/language/punctuation | Yes (PBs are arrays, one per config combo) | No (single entry per mode2 key) | ⚠ partial |
| **Account & Stats** | | | |
| Activity heatmap | Yes (`CountByYearAndDay` structure, server-maintained) | Yes (computed from Firestore result timestamps) | ✓ parity |
| Streaks | Yes (server-side, UTC hour-offset aware) | Yes (client-side, no hour-offset) | ⚠ partial |
| Friends system | Yes (backend API + Firestore subcollections) | Yes (Firestore subcollections) | ✓ parity |
| Public profile | Yes (`/profile/:username`) | Yes (`/profile/:username`) | ✓ parity |
| Profile bio, keyboard, social links | Yes (`profileDetails` field) | Not in NathanType user schema | ✗ missing |
| Leaderboard | Yes (daily + weekly XP + all-time, Redis-backed) | Stub only (static percentile table, no real data) | ✗ missing |
| Tags | Yes (per-result tags, tag PBs, commandline) | Not implemented | ✗ missing |
| Presets | Yes (saved config presets, commandline) | Not implemented | ✗ missing |
| **Test Modes** | | | |
| Quotes mode | Yes (database of quotes by length) | Yes (local quote list) | ⚠ partial |
| Funbox modes | Yes (~30+ officially listed funboxes) | Yes (custom funboxes: books, memes, songs, etc.) | ⚠ partial |
| Custom text mode | Yes | Yes | ✓ parity |
| Zen mode | Yes | Not implemented as a proper mode | ⚠ partial |
| Code mode | Not a standard mode | Listed in `TestMode` type, no implementation | ✗ missing |
| **Settings & UI** | | | |
| Themes | Yes (100+ themes, custom themes) | Yes (30+ themes) | ⚠ partial |
| Custom themes | Yes | Not implemented | ✗ missing |
| Font selection | Yes (commandline + settings) | Yes (Settings page font selector) | ✓ parity |
| Command line (cmd+k / cmd+shift+p) | Yes (full implementation, many commands) | Not implemented (hint shown but nothing wired) | ✗ missing |
| **Anti-cheat & Security** | | | |
| Anti-cheat | Yes (closed-source module, result hash, key timing) | Not implemented | ✗ missing |
| Duplicate result detection | Yes (last N result hashes checked) | Not implemented | ✗ missing |
| Result hash validation | Yes (object-hash library) | Not implemented | ✗ missing |
| Rate limiting | Yes (Redis-backed, per-endpoint limits) | Not implemented (relies on Firestore rules only) | ✗ missing |
| **Other Features** | | | |
| Replay feature | Yes (`test/replay.ts`) | Not implemented | ✗ missing |
| Recalculation utility | Yes (backend `recalculate-stats` command) | Yes (`reconcileStats.ts` — partial, has bug) | ⚠ broken |
| Discord integration | Yes (linked Discord ID, role updates for PBs) | Not implemented | ✗ missing |
| Premium tier | Yes (extended result history, features) | Not implemented | ✗ missing |
| Badges / inventory | Yes (`inventory.badges`) | Not implemented | ✗ missing |
| Weekly XP leaderboard | Yes (Redis-backed, top XP earners per week) | Not implemented | ✗ missing |
| Offline save queue | No (network required) | Yes (localStorage queue, retry on login) | NathanType advantage |
| Local result cache (60s) | In-memory snapshot | In-memory `resultCache` Map | ✓ parity |

---

## 1.4 Critical Bugs in NathanType

---

**[P0] reconcileStats zeros out timeTyping on every reconcile**

- File: `src/utils/reconcileStats.ts:31,81`
- What goes wrong: `let totalTimeTyping = 0` is declared and never accumulated (there is no `totalTimeTyping += r.testDuration` loop or equivalent). The function calls `updateDoc(userRef, { timeTyping: totalTimeTyping })` at line 81, which always writes `0`. Any user who runs a reconcile will have their `timeTyping` reset to zero.
- Monkeytype pattern: Monkeytype accumulates `snapshot.typingStats.timeTyping += time` in `frontend/src/ts/db.ts:354` where `time = testDuration + incompleteTestSeconds - afkDuration`.
- Fix: In the `resultsSnap.forEach` loop, accumulate `totalTimeTyping += r.modeOption` (for time mode results) or derive duration from the result document. The result document must store `timeElapsed`/`testDuration` — currently it does not. Either add `timeElapsed` to the saved result document in `firestoreService.ts → tx.set(resultRef, ...)`, or omit `timeTyping` from the reconcile write entirely.

---

**[P0] Dual UserProfile type mismatch: userStore vs AuthContext**

- File: `src/stores/userStore.ts:49` and `src/types/index.ts:148–162` vs `src/context/AuthContext.tsx:14–61`
- What goes wrong: `userStore.ts` imports `UserProfile` from `types/index.ts` (which has a nested `stats: { testsCompleted, timeTyping, highestWpm, ... }` shape). `AuthContext.tsx` defines a completely different `UserProfile` interface with top-level `completedTests`, `timeTyping`, `xp`, `level`, etc. The `updateUserStats()` action in `userStore.ts` at line 49 does `state.user.stats.testsCompleted + 1`, but the actual Firestore profile flowing through `AuthContext` has no `stats` object. At runtime the Zustand `user` is set by `setUser` in the store but the real profile comes from `useAuth()` — they are separate sources of truth that can diverge.
- Monkeytype pattern: Single source of truth via the snapshot object in `db.ts`. All components read from `getSnapshot()`.
- Fix: Delete `types/index.ts:UserProfile` entirely. Use only `AuthContext.tsx:UserProfile` across the app. Audit every import of `UserProfile` from `types/index.ts` and redirect to `context/AuthContext`.

---

**[P0] Local PB store diverges from Firestore PBs after first load**

- File: `src/stores/userStore.ts:64–76`, `src/hooks/useTypingTest.ts:457–458`
- What goes wrong: `checkAndUpdatePersonalBest()` in `userStore.ts` maintains a local Zustand PB map keyed by `getPbKey()` format (`time-30-0-false-false`). This is never hydrated from Firestore. On a fresh browser session the local map is empty. The user types a 30s test that is genuinely NOT a PB (their Firestore PB is 120 WPM). The local map has no entry, so `checkAndUpdatePersonalBest` returns `true` (new PB!). The results screen incorrectly shows "new personal best". `isNewPersonalBest` is also passed to `setCurrentResult` and stored in the test store.
- Monkeytype pattern: PB check is done server-side (`UserDAL.checkIfPb()`) against actual stored PBs, then the `isPb: true` flag is returned to the client.
- Fix: Remove the local PB check from `userStore.ts`. Read from `userProfile.personalBests` (which comes from Firestore via `AuthContext`) to determine PB status. In `handleTestComplete`, compare `stats.wpm` against `getPbEntry(userProfile, mode, mode2)?.wpm ?? 0`.

---

**[P1] Command palette hint shown but feature is completely absent**

- File: `src/pages/Home.tsx:150`
- What goes wrong: The keyboard hint at the bottom of the test area shows `⌘ + shift + p` labeled "command line". No keyboard listener is registered for this shortcut anywhere in the codebase. The commandline component directory referenced in older Monkeytype code does not exist in NathanType at all.
- Monkeytype pattern: `frontend/src/ts/commandline/commandline.ts` + hotkey registration in `frontend/src/ts/input/hotkeys/commandline.ts`.
- Fix: Either remove the hint from `Home.tsx:150` or build the command palette (large effort — see 1.5).

---

**[P1] Streak hour-offset not supported**

- File: `src/utils/firestoreService.ts:129–144`
- What goes wrong: The streak logic uses `new Date().toDateString()` which is timezone-local but does not respect the `preferences.streakHourOffset` field stored on the user profile. Users in non-UTC timezones who set an hour offset will still have their streak calculated against the local machine clock, not the configured offset. The `streakHourOffset` preference field in `UserProfile` is stored but never read during streak calculation.
- Monkeytype pattern: `backend/src/dal/user.ts:1136` uses `isYesterday(streak.lastResultTimestamp, streak.hourOffset ?? 0)` from `@monkeytype/util/date-and-time`.
- Fix: Read `profile.preferences?.streakHourOffset ?? 0` and apply it when constructing the comparison date strings. Replace the `toDateString()` pattern with UTC-offset-aware ISO date comparison.

---

**[P1] XP streakBonus is always 0 but displayed as a breakdown field**

- File: `src/utils/firestoreService.ts:55`, `src/components/Results/XpPanel.tsx:29`
- What goes wrong: `calcXp()` returns `streakBonus: 0` unconditionally. `XpPanel.tsx` filters rows by `value > 0` so the row is hidden — the display is fine. However the Firestore user document's XP will silently undercount compared to what would be expected if the streak bonus were implemented. Users with long streaks receive no bonus even though Monkeytype grants up to the configured `maxStreakMultiplier`.
- Monkeytype pattern: `result.ts:814–830` computes `streakModifier = mapRange(streak, 0, maxStreakDays, 0, maxStreakMultiplier)`.
- Fix: Pass the current streak length into `calcXp` and apply a streak multiplier. Start with a simple linear scale (e.g., `streakModifier = Math.min(streak / 100, 0.5)` for a max +50% bonus at 100-day streaks) before introducing configurable server parameters.

---

**[P1] Profile page at /profile route duplicates /account page**

- File: `src/App.tsx:114`, `src/pages/Profile.tsx`
- What goes wrong: Two routes render similar profile content: `/account` → `Account.tsx` (new design with full stats) and `/profile` → `Account` (redirected). `Profile.tsx` is also referenced from `Account.tsx`'s `/profile/:username` route resolution. There is actually a separate `Profile.tsx` page at the `/profile` path that is never reached because `App.tsx:114` maps `/profile` to `<ProtectedRoute><Account /></ProtectedRoute>`. The legacy `Profile.tsx` file is a dead code path.
- Fix: Delete `src/pages/Profile.tsx`. The `/profile/:username` route already correctly serves `PublicProfile.tsx` for public views, and `/account` serves the authenticated user's own account.

---

**[P2] Leaderboard card shows fake data**

- File: `src/components/Account/LeaderboardCard.tsx:3–14`
- What goes wrong: `wpmToRank()` converts WPM to a fake percentile rank using a hardcoded static lookup table. The displayed "3rd place" or "top 5%" values are meaningless. There is no real leaderboard data source.
- Monkeytype pattern: Backend maintains Redis-backed daily and all-time leaderboards in `utils/daily-leaderboards.ts` and `dal/leaderboards.ts`.
- Fix: Short-term — replace the card with a placeholder "leaderboards coming soon" message. Long-term — implement real leaderboard reads from a Firestore collection populated by Cloud Functions.

---

**[P2] GitHub OAuth may show stale loading state on popup close**

- File: `src/components/Auth/GitHubButton.tsx:15–16`
- What goes wrong: On `auth/popup-closed-by-user` or `auth/cancelled-popup-request`, the code calls `setLoading(false)` and `return`s — correct. But on any other error, `setLoading(false)` is called in the catch block AND `onError` is called. The button re-enables correctly. However if the user dismisses the popup without triggering a recognized error code, the loading spinner may not clear. This is a minor edge case.
- Fix: Ensure `finally { setLoading(false) }` is used instead of calling `setLoading(false)` in both branches.

---

**[P2] timeTyping never accumulates in userStore.updateUserStats**

- File: `src/stores/userStore.ts:47–62`
- What goes wrong: `updateUserStats()` updates the in-memory Zustand `user.stats.timeTyping`. But `user.stats` references the old `types/index.ts:UserProfile` shape (see P0 dual-type bug above). Even if the types matched, this local state is never written back to Firestore — `timeTyping` in Firestore is updated correctly in `saveTestResult()` via `increment(timeElapsed)`. The `user.stats` values in Zustand are therefore ephemeral and reset on page reload, creating a temporary display inconsistency.
- Fix: Delete `updateUserStats()` from `userStore.ts` as it's redundant with the Firestore `onSnapshot` real-time listener in `AuthContext`. The `userProfile` from `useAuth()` is always current.

---

## 1.5 Implementation Plan

Work is ordered from highest to lowest priority. Each PR is independently mergeable.

---

### PR 1 — Fix Critical Data Bugs (P0)
**Effort**: Small (< 2h)  
**Blocking dependencies**: None  

**Fixes included**:
1. **`reconcileStats.ts` timeTyping bug**: Add `timeElapsed`/`testDuration` field to the result document written in `firestoreService.ts → tx.set(resultRef, ...)`. Update `reconcileStats.ts` to sum that field. Alternatively, skip writing `timeTyping` in the reconcile (leaving Firestore's incremented value intact) — this is the safer fix.
2. **Delete `types/index.ts:UserProfile`**: Consolidate to `AuthContext.tsx:UserProfile` only. Find-replace all imports. Remove the orphaned `updateUserStats()` from `userStore.ts`.
3. **Fix local PB check in `useTypingTest.ts`**: Replace the Zustand-local `checkAndUpdatePersonalBest` call with a direct comparison against `userProfile.personalBests` from `useAuth()`.

---

### PR 2 — Streak & XP Accuracy Fixes (P1)
**Effort**: Small (< 2h)  
**Blocking dependencies**: PR 1 (needs `userProfile` type cleanup)  

**Fixes included**:
1. **Streak hour-offset**: Read `userProfile.preferences.streakHourOffset` in `firestoreService.ts → saveTestResult()` and apply it to the "today/yesterday" check. Write a small UTC-offset-aware date comparison function (analogous to Monkeytype's `isToday/isYesterday` from `@monkeytype/util`).
2. **Corrected-everything XP bonus**: Add a check in `calcXp()` for when all non-correct chars are 0 (no uncorrected errors, but not 100% acc) and apply `+0.25` modifier to match Monkeytype's behavior.
3. **XP streak bonus stub**: Add a basic streak multiplier to `calcXp()` — `streakBonus = Math.round(rawBase * Math.min(streak / 100, 0.5) * accuracyMod)`. This requires passing streak length into the function signature.

---

### PR 3 — Remove Dead Code & False UI (P1/P2)
**Effort**: Small (< 2h)  
**Blocking dependencies**: None  

**Fixes included**:
1. **Delete `Profile.tsx`** (dead code path) and remove the `/profile` → `Account` route alias that shadows it.
2. **Remove or stub the leaderboard card**: Replace `LeaderboardCard.tsx` content with a "coming soon" placeholder. Remove the fake `wpmToRank` percentile math.
3. **Remove the `⌘+shift+p` command line hint** from `Home.tsx:150` until the feature is built, or replace it with an achievable shortcut.
4. **Fix GitHub/Google loading state**: Change both auth buttons to use `finally { setLoading(false) }`.

---

### PR 4 — Email Verification & Account Linking (P1)
**Effort**: Medium (2–6h)  
**Blocking dependencies**: PR 1  

**Fixes included**:
1. **Email verification**: After `createUserWithEmailAndPassword`, call `sendEmailVerification(cred.user)`. Add a dismissible banner in the app when `currentUser.emailVerified === false` for email users. Add a "resend verification" button.
2. **Account linking**: In `AccountSettings.tsx`, add buttons to link additional providers (`linkWithPopup(currentUser, provider)`). Handle `auth/credential-already-in-use` — which means the other account already exists and needs to be merged. Show linked providers in the settings UI.

---

### PR 5 — Real Leaderboard (Large, Deferred)
**Effort**: Large (6h+)  
**Blocking dependencies**: None (but PR 3 removes the stub first)  

**Features included**:
1. Create a Firestore `leaderboards/{mode}_{mode2}` collection or use Cloud Functions to maintain top-N documents.
2. On result save, check if the WPM beats the current top-N and update the leaderboard document.
3. Build a leaderboard view that fetches and displays the real top results.
4. Update `LeaderboardCard.tsx` to display actual rank based on real Firestore data.

---

### PR 6 — Command Palette (Large, Deferred)
**Effort**: Large (6h+)  
**Blocking dependencies**: PR 3 (removes misleading hint first)  

**Features included**:
1. Implement a `CommandPalette` component triggered by `⌘+shift+p` (or `⌘+k`).
2. Command categories: navigation (go to account, settings, friends), test config (set mode, time, words), appearance (switch theme, font).
3. Fuzzy search/filter of commands as user types.
4. Reference: `monkeytype/frontend/src/ts/commandline/commandline.ts` for the pattern (list + action + exec model).

---

### PR 7 — Streak Hour Offset UI (Medium, Deferred)
**Effort**: Medium (2–6h)  
**Blocking dependencies**: PR 2 (streak logic must work first)  

**Features included**:
1. Add a timezone/hour-offset selector in `AccountSettings.tsx` (mirroring Monkeytype's "streak hour offset" setting: -11 to +12 in 0.5 steps).
2. Write the selected value to `preferences.streakHourOffset` in Firestore.
3. Ensure `saveTestResult` reads this value from the user doc inside the transaction (it currently does read from `profile.streak`, but not the hour offset).

---

### PR 8 — Daily XP Bonus (Medium, Deferred)
**Effort**: Medium (2–6h)  
**Blocking dependencies**: PR 2  

**Features included**:
1. In `calcXp()` / `computeXpResult()`, check if `lastResultTimestamp` (from `profile.streak.lastResultTimestamp`) is from a previous day.
2. If so, award `clamp(currentTotalXp * 0.05, 50, 500)` as a daily bonus.
3. Add `dailyBonus` to `XpBreakdown` and display it in `XpPanel.tsx`.

---

### PR 9 — Anti-cheat Baseline (Large, Deferred)
**Effort**: Large (6h+)  
**Blocking dependencies**: None  

**Features included**:
1. Client-side: record keystroke timing during tests (key-down timestamps per character). Pass as `keySpacing` / `keyDuration` arrays in the save payload.
2. Client-side: reject obviously impossible results (e.g., WPM > 300 for any duration, accuracy exactly 100% on first ever test with WPM > 150).
3. Consider using Firestore Cloud Functions as a lightweight serverless backend validator, replacing the current "client writes directly to Firestore" model. This would allow server-side hash checking and rate limiting.

---

### PR 10 — Tags & Presets (Large, Deferred)
**Effort**: Large (6h+)  
**Blocking dependencies**: PR 6 (commandline makes presets much more useful)  

**Features included**:
1. Add `tags: UserTag[]` to `UserProfile` in `AuthContext.tsx`.
2. Allow tagging results post-save (on the result screen or in the history table).
3. Implement presets: saved test configurations with a name. Accessible from the Mode selector and command palette.

---

*End of report.*
