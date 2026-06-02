import { addDoc, collection, doc, getDoc, increment, runTransaction, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile } from '../context/AuthContext'
import type { XpResult } from '../types/index.js'
import { getLevelFromTotalXp, getLevelMaxXp, getTotalXpToReachLevel } from '../data/levels/levels'

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
function calcXp(data: TestResultData, timeElapsed: number): import('../types/index.js').XpBreakdown {
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

export async function saveTestResult(
  uid: string,
  data: TestResultData,
  timeElapsed: number
): Promise<XpResult> {
  const breakdown = calcXp(data, timeElapsed)
  const xpGained = breakdown.total

  // Save the raw test result — don't block XP on this
  try {
    await addDoc(collection(db, 'testResults', uid, 'results'), {
      wpm: data.wpm,
      rawWpm: data.rawWpm,
      accuracy: data.accuracy,
      consistency: data.consistency,
      mode: data.mode,
      modeOption: data.modeOption,
      language: data.language,
      chars: data.chars,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.error('Failed to save test result doc:', err)
  }

  // Default — returned if the transaction fails
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
    const userRef = doc(db, 'users', uid)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef)
      if (!snap.exists()) return

      const profile = snap.data() as UserProfile

      // ── Cumulative XP (Monkeytype approach) ──────────────────────
      // xp is a lifetime total; level is derived from it via formula.
      const prevTotalXp = profile.xp ?? 0
      const newTotalXp  = prevTotalXp + xpGained

      const prevLevel = getLevelFromTotalXp(prevTotalXp)
      const newLevel  = getLevelFromTotalXp(newTotalXp)
      const didLevelUp = newLevel > prevLevel

      // Progress within the new current level
      const xpInLevel  = newTotalXp - getTotalXpToReachLevel(newLevel)
      const levelMaxXp = getLevelMaxXp(newLevel)

      // ── Streak ───────────────────────────────────────────────────
      const today     = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86_400_000).toDateString()
      const lastDate  = profile.lastTestDate ? new Date(profile.lastTestDate).toDateString() : null
      let currentStreak = profile.currentStreak ?? 0
      if (lastDate === today) {
        // already typed today — streak unchanged
      } else if (lastDate === yesterday) {
        currentStreak += 1
      } else {
        currentStreak = 1
      }
      const bestStreak = Math.max(profile.bestStreak ?? 0, currentStreak)

      const updates: Record<string, unknown> = {
        xp: newTotalXp,
        level: newLevel,
        xpToNextLevel: levelMaxXp,
        totalTests: (profile.totalTests ?? 0) + 1,
        totalTimeTyping: (profile.totalTimeTyping ?? 0) + timeElapsed,
        currentStreak,
        bestStreak,
        lastTestDate: Date.now(),
      }

      const pbKey = getBestWpmKey(data.mode, data.modeOption)
      if (pbKey && data.wpm > (profile.bestWpm?.[pbKey] ?? 0)) {
        updates.bestWpm = { ...profile.bestWpm, [pbKey]: data.wpm }
        updates.bestWpmDates = { ...profile.bestWpmDates, [pbKey]: Date.now() }
      }

      tx.update(userRef, updates)

      xpResult = {
        xpGained,
        xpBreakdown: breakdown,
        didLevelUp,
        prevLevel,
        newLevel,
        newXp: Math.max(0, xpInLevel),
        newXpToNextLevel: levelMaxXp,
      }
    })
  } catch (err) {
    console.error('Failed to update user stats:', err)
  }

  return xpResult
}

/** Fire-and-forget: increment testsStarted when a new test begins. */
export function incrementTestsStarted(uid: string): void {
  updateDoc(doc(db, 'users', uid), { testsStarted: increment(1) })
    .catch((err) => console.error('incrementTestsStarted failed:', err))
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
