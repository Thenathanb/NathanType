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

type BestWpmKey = keyof UserProfile['bestWpm']

function getBestWpmKey(mode: string, modeOption: number): BestWpmKey | null {
  if (mode === 'time' && [15, 30, 60, 120].includes(modeOption)) {
    return `time${modeOption}` as BestWpmKey
  }
  if (mode === 'words' && [10, 25, 50, 100].includes(modeOption)) {
    return `words${modeOption}` as BestWpmKey
  }
  return null
}

/**
 * Monkeytype-style XP formula:
 * base = testDuration * 2  (2 XP per second)
 * modifier builds up from mode/options bonuses
 * accuracy penalty: max(0, (acc - 50) / 50)  — below 50% acc earns nothing
 */
export function calcXp(data: TestResultData, timeElapsed: number): import('../types/index.js').XpBreakdown {
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
  const total = Math.max(1, Math.round(rawBase * fullModifier * accuracyMod))

  // Breakdown for display — split the total back into labelled parts
  const base         = Math.max(0, Math.round(rawBase * accuracyMod))
  const accuracyBonus = hasPerfectAcc
    ? Math.max(0, Math.round(rawBase * 0.5 * accuracyMod))
    : 0
  const modeBonus    = Math.max(0, total - base - accuracyBonus)

  return { base, accuracyBonus, streakBonus: 0, modeBonus, total }
}

/**
 * Compute the full XpResult locally — no Firestore needed.
 * Call this immediately when the test ends so the UI updates instantly.
 */
export function computeXpResult(
  currentTotalXp: number,
  data: TestResultData,
  timeElapsed: number,
): XpResult {
  const breakdown = calcXp(data, timeElapsed)
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
  const breakdown = calcXp(data, timeElapsed)
  const xpGained  = breakdown.total

  // Pre-create the result doc ref so we can include it in the transaction.
  // Using doc(collection(...)) gives a client-generated ID without a write.
  const resultRef = doc(collection(db, 'testResults', uid, 'results'))
  const userRef   = doc(db, 'users', uid)

  // Default — returned if the transaction fails so the UI still shows XP
  let xpResult: XpResult = {
    xpGained,
    xpBreakdown: breakdown,
    didLevelUp: false,
    prevLevel: 1,
    newLevel: 1,
    newXp: 0,
    newXpToNextLevel: 100,
  }

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef)
      if (!snap.exists()) {
        // User doc missing — write the result but skip counter updates.
        tx.set(resultRef, {
          wpm: data.wpm, rawWpm: data.rawWpm, accuracy: data.accuracy,
          consistency: data.consistency, mode: data.mode, modeOption: data.modeOption,
          language: data.language, chars: data.chars,
          timestamp: serverTimestamp(), clientTimestamp: Date.now(),
        })
        return
      }

      const profile = snap.data() as UserProfile

      // ── XP (cumulative total) ─────────────────────────────────────
      const prevTotalXp = profile.xp ?? 0
      const newTotalXp  = prevTotalXp + xpGained
      const prevLevel   = getLevelFromTotalXp(prevTotalXp)
      const newLevel    = getLevelFromTotalXp(newTotalXp)
      const xpInLevel   = Math.max(0, newTotalXp - getTotalXpToReachLevel(newLevel))
      const levelMaxXp  = getLevelMaxXp(newLevel)
      const didLevelUp  = newLevel > prevLevel

      // ── Streak ───────────────────────────────────────────────────
      const today        = new Date().toDateString()
      const yesterday    = new Date(Date.now() - 86_400_000).toDateString()
      const lastDate     = profile.lastTestDate ? new Date(profile.lastTestDate).toDateString() : null
      let currentStreak  = profile.currentStreak ?? 0
      if (lastDate === today) {
        // already typed today — streak unchanged
      } else if (lastDate === yesterday) {
        currentStreak += 1
      } else {
        currentStreak = 1
      }
      const bestStreak = Math.max(profile.bestStreak ?? 0, currentStreak)

      // ── User doc update (use increment() to avoid stale-read races) ──
      const userUpdates: Record<string, unknown> = {
        xp: newTotalXp,
        level: newLevel,
        xpToNextLevel: levelMaxXp,
        totalTests: increment(1),
        totalTimeTyping: increment(timeElapsed),
        currentStreak,
        bestStreak,
        lastTestDate: serverTimestamp(),
      }

      // ── Personal best ─────────────────────────────────────────────
      const pbKey = getBestWpmKey(data.mode, data.modeOption)
      if (pbKey && data.wpm > (profile.bestWpm?.[pbKey] ?? 0)) {
        userUpdates[`bestWpm.${pbKey}`]      = data.wpm
        userUpdates[`bestWpmDates.${pbKey}`] = Date.now()
      }

      // ── Result document ───────────────────────────────────────────
      tx.set(resultRef, {
        wpm: data.wpm, rawWpm: data.rawWpm, accuracy: data.accuracy,
        consistency: data.consistency, mode: data.mode, modeOption: data.modeOption,
        language: data.language, chars: data.chars,
        timestamp: serverTimestamp(), clientTimestamp: Date.now(),
      })

      // Both writes go in the same transaction — atomic commit.
      tx.update(userRef, userUpdates)

      xpResult = {
        xpGained, xpBreakdown: breakdown,
        didLevelUp, prevLevel, newLevel,
        newXp: xpInLevel, newXpToNextLevel: levelMaxXp,
      }
    })
  } catch (err) {
    logFirestoreError('saveTestResult', err)
    // Queue for retry when connection recovers
    try {
      const { queueFailedSave } = await import('./saveQueue')
      queueFailedSave({ uid, data, timeElapsed })
    } catch { /* saveQueue unavailable */ }
  }

  return xpResult
}

/** Fire-and-forget: increment testsStarted when the user types the first character. */
export function incrementTestsStarted(uid: string): void {
  updateDoc(doc(db, 'users', uid), { testsStarted: increment(1) })
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
