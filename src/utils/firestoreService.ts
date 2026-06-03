import { collection, doc, getDoc, increment, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile } from '../context/AuthContext'
import type { XpResult } from '../types/index.js'
import { getLevelFromTotalXp, getLevelMaxXp, getTotalXpToReachLevel } from '../data/levels/levels'
import { logFirestoreError } from './errorLog'

export interface TestResultData {
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  mode: string
  modeOption: number
  language: string
  punctuation?: boolean
  numbers?: boolean
  chars: { correct: number; incorrect: number; extra: number; missed: number }
}

// Returns which "day bucket" a timestamp falls in, shifted by the user's hour offset.
// Matching Monkeytype's isToday/isYesterday UTC-offset pattern (dal/user.ts:1136).
function getDayNumber(ts: number, hourOffsetHours: number): number {
  return Math.floor((ts + hourOffsetHours * 3_600_000) / 86_400_000)
}

/**
 * Monkeytype-style XP formula — pattern from backend/src/api/controllers/result.ts:767.
 * base = testDuration * 2  (2 XP per second of active typing)
 * modifier stacks mode/accuracy/streak bonuses
 * accuracy penalty: max(0, (acc - 50) / 50)  — below 50% acc earns nothing
 *
 * @param streakLength  Current streak day count (0 = no streak bonus)
 */
export function calcXp(
  data: TestResultData,
  timeElapsed: number,
  streakLength = 0,
): import('../types/index.js').XpBreakdown {
  const rawBase = Math.round(timeElapsed * 2)

  // Accuracy modifier scales from 0 (at 50% acc) to 1 (at 100% acc)
  const accuracyMod = Math.max(0, (data.accuracy - 50) / 50)

  // Per-modifier bonuses (stacked on top of 1.0)
  let modifierBonus = 0
  const hasPerfectAcc = data.accuracy === 100
  if (hasPerfectAcc) modifierBonus += 0.5
  if (data.mode === 'quote') {
    modifierBonus += 0.5
  } else {
    if (data.punctuation) modifierBonus += 0.4
    if (data.numbers)     modifierBonus += 0.1
  }
  if (data.mode === 'meme' || data.mode === 'content') modifierBonus += 0.3

  const fullModifier = 1 + modifierBonus
  const baseXp = Math.max(0, Math.round(rawBase * fullModifier * accuracyMod))

  // Streak bonus: scales linearly from 0% to 50% at 100-day streak (matches MT maxStreakMultiplier)
  const streakBonus = streakLength > 1
    ? Math.round(rawBase * Math.min((streakLength - 1) / 100, 0.5) * accuracyMod)
    : 0

  const total = Math.max(1, baseXp + streakBonus)

  // Breakdown for display — split into labelled parts
  const base         = Math.max(0, Math.round(rawBase * accuracyMod))
  const accuracyBonus = hasPerfectAcc
    ? Math.max(0, Math.round(rawBase * 0.5 * accuracyMod))
    : 0
  const modeBonus    = Math.max(0, baseXp - base - accuracyBonus)

  return { base, accuracyBonus, streakBonus, modeBonus, total }
}

/**
 * Compute the full XpResult locally — no Firestore needed.
 * Call this immediately when the test ends so the UI updates instantly.
 * Pass streakLength so the streak bonus is reflected in the immediate display.
 */
export function computeXpResult(
  currentTotalXp: number,
  data: TestResultData,
  timeElapsed: number,
  streakLength = 0,
): XpResult {
  const breakdown = calcXp(data, timeElapsed, streakLength)
  const xpGained  = breakdown.total
  const newTotal   = currentTotalXp + xpGained
  const prevLevel  = getLevelFromTotalXp(currentTotalXp)
  const newLevel   = getLevelFromTotalXp(newTotal)
  const xpInLevel  = Math.max(0, newTotal - getTotalXpToReachLevel(newLevel))
  const levelMaxXp = getLevelMaxXp(newLevel)
  return {
    xpGained,
    xpBreakdown: breakdown,
    didLevelUp: newLevel > prevLevel,
    prevLevel,
    newLevel,
    newXp: xpInLevel,
    newXpToNextLevel: levelMaxXp,
  }
}

export async function saveTestResult(
  uid: string,
  data: TestResultData,
  timeElapsed: number
): Promise<XpResult> {
  const resultRef = doc(collection(db, 'testResults', uid, 'results'))
  const userRef = doc(db, 'users', uid)

  // Populated inside the transaction once we have live profile data
  let xpResult: XpResult = {
    xpGained: 0, xpBreakdown: { base: 0, accuracyBonus: 0, streakBonus: 0, modeBonus: 0, total: 0 },
    didLevelUp: false, prevLevel: 1, newLevel: 1, newXp: 0, newXpToNextLevel: 100,
  }

  // Result fields written to Firestore — timeElapsed stored so reconcileStats can sum it
  const resultDoc = {
    wpm: data.wpm, rawWpm: data.rawWpm, accuracy: data.accuracy,
    consistency: data.consistency, mode: data.mode, modeOption: data.modeOption,
    language: data.language, chars: data.chars, timeElapsed,
    timestamp: serverTimestamp(), clientTimestamp: Date.now(),
  }

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef)
      if (!snap.exists()) {
        tx.set(resultRef, resultDoc)
        return
      }

      const profile = snap.data() as UserProfile
      const now = Date.now()

      // ── Streak — hour-offset-aware (Monkeytype pattern: dal/user.ts:1136) ──
      const hourOffset = profile.preferences?.streakHourOffset ?? 0
      const prevStreak = profile.streak
      const lastTs = prevStreak?.lastResultTimestamp
        ?? (profile as unknown as { lastTestDate?: number }).lastTestDate
        ?? 0

      const todayDay     = getDayNumber(now, hourOffset)
      const lastDay      = lastTs ? getDayNumber(lastTs, hourOffset) : -1
      let streakLen = prevStreak?.length
        ?? (profile as unknown as { currentStreak?: number }).currentStreak
        ?? 0

      if (lastDay === todayDay) {
        // already typed today — no change
      } else if (lastDay === todayDay - 1) {
        streakLen += 1
      } else {
        streakLen = 1
      }
      const streakMax = Math.max(
        prevStreak?.maxLength ?? (profile as unknown as { bestStreak?: number }).bestStreak ?? 0,
        streakLen
      )
      const newStreak = { length: streakLen, maxLength: streakMax, lastResultTimestamp: now }

      // ── XP — calculated inside transaction using live streak ──────
      const breakdown = calcXp(data, timeElapsed, streakLen)
      const xpGained = breakdown.total
      const prevTotalXp = profile.xp ?? 0
      const newTotalXp = prevTotalXp + xpGained
      const prevLevel = getLevelFromTotalXp(prevTotalXp)
      const newLevel = getLevelFromTotalXp(newTotalXp)
      const xpInLevel = Math.max(0, newTotalXp - getTotalXpToReachLevel(newLevel))
      const levelMaxXp = getLevelMaxXp(newLevel)

      // ── Personal bests ─────────────────────────────────────────────
      const pbMode = (data.mode === 'time' ? 'time' : data.mode === 'words' ? 'words' : null)
      const pbMode2 = String(data.modeOption)
      const userUpdates: Record<string, unknown> = {
        xp: newTotalXp,
        level: newLevel,
        xpToNextLevel: levelMaxXp,
        completedTests: increment(1),
        timeTyping: increment(timeElapsed),
        streak: newStreak,
      }

      if (pbMode) {
        const nestedPb = profile.personalBests?.[pbMode]?.[pbMode2]
        const legacyKey = `${pbMode}${pbMode2}` as keyof NonNullable<UserProfile['bestWpm']>
        const legacyWpm = profile.bestWpm?.[legacyKey] ?? 0
        const currentBestWpm = nestedPb?.wpm ?? legacyWpm ?? 0
        if (data.wpm > currentBestWpm) {
          userUpdates[`personalBests.${pbMode}.${pbMode2}`] = {
            wpm: data.wpm, raw: data.rawWpm, acc: data.accuracy,
            consistency: data.consistency, timestamp: now,
          }
        }
      }

      tx.set(resultRef, resultDoc)
      tx.update(userRef, userUpdates)

      xpResult = {
        xpGained, xpBreakdown: breakdown,
        didLevelUp: newLevel > prevLevel, prevLevel, newLevel,
        newXp: xpInLevel, newXpToNextLevel: levelMaxXp,
      }
    })
  } catch (err) {
    logFirestoreError('saveTestResult', err)
    try {
      const { queueFailedSave } = await import('./saveQueue')
      queueFailedSave({ uid, data, timeElapsed })
    } catch { /* queue unavailable */ }
  }

  return xpResult
}

/** Fire-and-forget: increment startedTests when the user types the first character. */
export function incrementTestsStarted(uid: string): void {
  updateDoc(doc(db, 'users', uid), { startedTests: increment(1) })
    .catch((err) => logFirestoreError('incrementTestsStarted', err))
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  return !snap.exists()
}

export async function setUsername(
  uid: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  const key = username.toLowerCase()
  const usernameRef = doc(db, 'usernames', key)
  const userRef = doc(db, 'users', uid)

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(usernameRef)
      if (snap.exists()) throw new Error('username-taken')
      tx.set(usernameRef, { uid })
      tx.update(userRef, { username })
    })
    return { success: true }
  } catch (err) {
    if ((err as Error).message === 'username-taken') {
      return { success: false, error: 'username already taken' }
    }
    console.error('setUsername failed:', err)
    return { success: false, error: 'something went wrong — please try again' }
  }
}

// ── Friends ──────────────────────────────────────────────────────

export async function sendFriendRequest(fromUid: string, fromUsername: string, toUid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const reqRef = doc(db, 'users', toUid, 'friendRequests', fromUid)
    await setDoc(reqRef, { fromUid, fromUsername, sentAt: Date.now() })
    return { success: true }
  } catch (err) {
    console.error('sendFriendRequest failed:', err)
    return { success: false, error: 'failed to send request' }
  }
}

export async function acceptFriendRequest(myUid: string, fromUid: string): Promise<void> {
  const { arrayUnion, deleteDoc } = await import('firebase/firestore')
  const now = Date.now()
  await Promise.all([
    import('firebase/firestore').then(({ updateDoc }) =>
      updateDoc(doc(db, 'users', myUid), { friends: arrayUnion({ uid: fromUid, since: now }) })
    ),
    import('firebase/firestore').then(({ updateDoc }) =>
      updateDoc(doc(db, 'users', fromUid), { friends: arrayUnion({ uid: myUid, since: now }) })
    ),
    deleteDoc(doc(db, 'users', myUid, 'friendRequests', fromUid)),
  ])
}

export async function declineFriendRequest(myUid: string, fromUid: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore')
  await deleteDoc(doc(db, 'users', myUid, 'friendRequests', fromUid))
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const { updateDoc, arrayRemove } = await import('firebase/firestore')
  await Promise.all([
    updateDoc(doc(db, 'users', myUid), { friends: arrayRemove({ uid: friendUid }) }),
    updateDoc(doc(db, 'users', friendUid), { friends: arrayRemove({ uid: myUid }) }),
  ])
}

export async function getUserByUsername(username: string): Promise<{ uid: string; profile: UserProfile } | null> {
  try {
    const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
    if (!snap.exists()) return null
    const { uid } = snap.data() as { uid: string }
    const profileSnap = await getDoc(doc(db, 'users', uid))
    if (!profileSnap.exists()) return null
    return { uid, profile: profileSnap.data() as UserProfile }
  } catch {
    return null
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const { updateDoc } = await import('firebase/firestore')
  await updateDoc(doc(db, 'users', uid), updates as Record<string, unknown>)
}
