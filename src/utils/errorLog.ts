import toast from 'react-hot-toast'

export function logFirestoreError(operation: string, err: unknown): void {
  const e = err as { code?: string; message?: string; stack?: string }
  console.error(`[Firestore ${operation} failed]`, {
    code: e.code ?? 'unknown',
    message: e.message ?? String(err),
    stack: e.stack,
  })

  if (import.meta.env.DEV) {
    toast.error(`firestore ${operation}: ${e.code ?? e.message ?? 'error'}`, {
      duration: 4000,
      id: `fs-err-${operation}`,
    })
  }
}
