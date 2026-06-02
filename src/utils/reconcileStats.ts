import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { logFirestoreError } from './errorLog'
import type { PersonalBestEntry } from '../context/AuthContext'

interface RawResult {
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  mode: string
  modeOption: number
  clientTimestamp?: number
  timestamp?: { toMillis?: () => number } | number
}

const TIME_OPTIONS = ['15', '30', '60', '120'] as const
const WORD_OPTIONS = ['10', '25', '50', '100'] as const

function isTimeMode(mode: string, modeOption: string): boolean {
  return mode === 'time' && (TIME_OPTIONS as readonly string[]).includes(modeOption)
}
function isWordsMode(mode: string, modeOption: string): boolean {
  return mode === 'words' && (WORD_OPTIONS as readonly string[]).includes(modeOption)
}

export async function reconcileStats(uid: string): Promise<{ totalTests: number; fixed: string[] }> {
  const resultsSnap = await getDocs(collection(db, 'testResults', uid, 'results'))

  let totalTests = 0
  let totalTimeTyping = 0

  const personalBests: {
    time: Partial<Record<string, PersonalBestEntry>>
    words: Partial<Record<string, PersonalBestEntry>>
  } = { time: {}, words: {} }

  resultsSnap.forEach(docSnap => {
    const r = docSnap.data() as RawResult
    totalTests++

    const ts = typeof r.timestamp === 'number'
      ? r.timestamp
      : (r.timestamp as { toMillis?: () => number })?.toMillis?.()
        ?? r.clientTimestamp
        ?? Date.now()

    const mode2 = String(r.modeOption)

    if (isTimeMode(r.mode, mode2)) {
      const existing = personalBests.time[mode2]
      if (!existing || r.wpm > existing.wpm) {
        personalBests.time[mode2] = {
          wpm: r.wpm,
          raw: r.rawWpm ?? r.wpm,
          acc: r.accuracy ?? 0,
          consistency: r.consistency ?? 0,
          timestamp: ts,
        }
      }
    } else if (isWordsMode(r.mode, mode2)) {
      const existing = personalBests.words[mode2]
      if (!existing || r.wpm > existing.wpm) {
        personalBests.words[mode2] = {
          wpm: r.wpm,
          raw: r.rawWpm ?? r.wpm,
          acc: r.accuracy ?? 0,
          consistency: r.consistency ?? 0,
          timestamp: ts,
        }
      }
    }
  })

  const fixed: string[] = []
  const userRef = doc(db, 'users', uid)

  try {
    await updateDoc(userRef, {
      completedTests: totalTests,
      timeTyping: totalTimeTyping,
      personalBests,
      // don't touch: addedAt, xp, level, streak, startedTests
    })
    fixed.push(`completedTests → ${totalTests}`)
    const pbCount =
      Object.values(personalBests.time).filter(Boolean).length +
      Object.values(personalBests.words).filter(Boolean).length
    fixed.push(`personalBests updated for ${pbCount} modes`)
  } catch (err) {
    logFirestoreError('reconcileStats', err)
    throw err
  }

  return { totalTests, fixed }
}
