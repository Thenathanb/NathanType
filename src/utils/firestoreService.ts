import { addDoc, collection, doc, getDoc, increment, runTransaction, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile } from '../context/AuthContext'
import type { XpResult } from '../types/index.js'

export interface TestResultData {
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  mode: string
  modeOption: number
  language: string
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

function calcXp(data: TestResultData): import('../types/index.js').XpBreakdown {
  const base = Math.round(data.wpm * (data.accuracy / 100))

  const accuracyBonus = data.accuracy === 100 ? 10 : 0

  // Speed milestone bonus
  let speedBonus = 0
  if      (data.wpm >= 150) speedBonus = 50
  else if (data.wpm >= 120) speedBonus = 30
  else if (data.wpm >= 100) speedBonus = 20
  else if (data.wpm >=  80) speedBonus = 10
  else if (data.wpm >=  60) speedBonus = 5

  // Mode bonus
  let modeBonus = 0
  if (data.mode === 'meme')    modeBonus = 5
  if (data.mode === 'quote')   modeBonus = 3
  if (data.mode === 'content') modeBonus = 3

  // Long test multiplier applied to base only (60s → 1.2×, 120s → 1.5×)
  const multiplier =
    data.mode === 'time' && data.modeOption >= 120 ? 1.5 :
    data.mode === 'time' && data.modeOption >= 60  ? 1.2 : 1
  const adjustedBase = Math.round(base * multiplier)

  const total = adjustedBase + accuracyBonus + speedBonus + modeBonus

  return { base: adjustedBase, accuracyBonus, speedBonus, modeBonus, total }
}

export async function saveTestResult(
  uid: string,
  data: TestResultData,
  timeElapsed: number
): Promise<XpResult> {
  const breakdown = calcXp(data)
  const totalXP = breakdown.total

  // Save the test result document — await it so failures surface properly
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
    // Don't block XP — continue even if the result save fails
  }

  let xpResult: XpResult = {
    xpGained: totalXP,
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
      const prevLevel = profile.level
      let xp = profile.xp + totalXP
      let level = profile.level
      let xpToNextLevel = profile.xpToNextLevel
      let didLevelUp = false

      while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel
        level++
        xpToNextLevel = Math.round(xpToNextLevel * 1.15)
        didLevelUp = true
      }

      // Streak calculation
      const today = new Date().toDateString()
      const lastDate = profile.lastTestDate ? new Date(profile.lastTestDate).toDateString() : null
      const yesterday = new Date(Date.now() - 86_400_000).toDateString()
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
        totalTests: profile.totalTests + 1,
        totalTimeTyping: profile.totalTimeTyping + timeElapsed,
        xp,
        level,
        xpToNextLevel,
        currentStreak,
        bestStreak,
        lastTestDate: Date.now(),
      }

      // Update best WPM for this mode/option if it's a new record
      const pbKey = getBestWpmKey(data.mode, data.modeOption)
      if (pbKey && data.wpm > (profile.bestWpm[pbKey] || 0)) {
        updates.bestWpm = { ...profile.bestWpm, [pbKey]: data.wpm }
        updates.bestWpmDates = { ...profile.bestWpmDates, [pbKey]: Date.now() }
      }

      tx.update(userRef, updates)

      xpResult = { xpGained: totalXP, xpBreakdown: breakdown, didLevelUp, prevLevel, newLevel: level, newXp: xp, newXpToNextLevel: xpToNextLevel }
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
