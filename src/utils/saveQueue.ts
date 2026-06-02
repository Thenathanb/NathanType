import type { TestResultData } from './firestoreService'

const QUEUE_KEY = 'nt-pending-saves'

interface QueuedSave {
  uid: string
  data: TestResultData
  timeElapsed: number
  queuedAt: number
}

export function queueFailedSave(item: Omit<QueuedSave, 'queuedAt'>): void {
  try {
    const queue: QueuedSave[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
    // Discard items older than 7 days to prevent unbounded growth
    const cutoff = Date.now() - 7 * 86_400_000
    const fresh = queue.filter(i => i.queuedAt > cutoff)
    fresh.push({ ...item, queuedAt: Date.now() })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(fresh))
  } catch {
    // localStorage unavailable — ignore
  }
}

export async function processQueue(): Promise<void> {
  let queue: QueuedSave[] = []
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return
  }
  if (queue.length === 0) return

  const { saveTestResult } = await import('./firestoreService')
  const { logFirestoreError } = await import('./errorLog')

  const remaining: QueuedSave[] = []
  for (const item of queue) {
    try {
      await saveTestResult(item.uid, item.data, item.timeElapsed)
    } catch (err) {
      logFirestoreError('processQueue retry', err)
      remaining.push(item)
    }
  }

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  } catch { /* ignore */ }
}
