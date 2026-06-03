import toast from 'react-hot-toast'

export function logFirestoreError(operation: string, err: unknown): void {
  const e = err as { code?: string; message?: string; stack?: string }
  console.error(`[Firestore ${operation} failed]`, {
    code: e.code ?? 'unknown',
    message: e.message ?? String(err),
    stack: e.stack,
  })

  const code = e.code ?? ''
  const msg = code === 'permission-denied'
    ? 'firestore: permission denied — deploy your security rules (see console)'
    : `firestore ${operation}: ${code || e.message || 'error'}`

  toast.error(msg, { duration: 6000, id: `fs-err-${operation}` })
}
