import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { logFirestoreError } from './errorLog'

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

const PB_KEYS = ['time15','time30','time60','time120','words10','words25','words50','words100'] as const
type PbKey = typeof PB_KEYS[number]

function modeKey(mode: string, modeOption: number): PbKey | null {
  const k = `${mode}${modeOption}` as PbKey
  return PB_KEYS.includes(k) ? k : null
}

export async function reconcileStats(uid: string): Promise<{ totalTests: number; fixed: string[] }> {
  const resultsSnap = await getDocs(collection(db, 'testResults', uid, 'results'))

  let totalTests = 0
  let totalTimeTyping = 0
  const bestWpm: Record<PbKey, number> = Object.fromEntries(PB_KEYS.map(k => [k, 0])) as Record<PbKey, number>
  const bestWpmDates: Record<PbKey, number | null> = Object.fromEntries(PB_KEYS.map(k => [k, null])) as Record<PbKey, number | null>

  resultsSnap.forEach(docSnap => {
    const r = docSnap.data() as RawResult
    totalTests++

    const ts = typeof r.timestamp === 'number'
      ? r.timestamp
      : (r.timestamp as { toMillis?: () => number })?.toMillis?.()
        ?? r.clientTimestamp
        ?? Date.now()

    const key = modeKey(r.mode, r.modeOption)
    if (key && r.wpm > (bestWpm[key] ?? 0)) {
      bestWpm[key] = r.wpm
      bestWpmDates[key] = ts
    }
  })

  const fixed: string[] = []
  const userRef = doc(db, 'users', uid)

  try {
    await updateDoc(userRef, {
      totalTests,
      totalTimeTyping,
      bestWpm,
      bestWpmDates,
      // don't touch: createdAt, xp, level, streak, testsStarted
    })
    fixed.push(`totalTests → ${totalTests}`)
    fixed.push(`bestWpm updated for ${Object.values(bestWpm).filter(v => v > 0).length} modes`)
  } catch (err) {
    logFirestoreError('reconcileStats', err)
    throw err
  }

  return { totalTests, fixed }
}
