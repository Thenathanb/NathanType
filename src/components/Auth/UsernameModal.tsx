import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { checkUsernameAvailable, setUsername } from '../../utils/firestoreService'

interface UsernameModalProps {
  isOpen: boolean
  onClose: () => void
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'check-failed'

const STATUS_TEXT: Record<Status, string> = {
  idle: '',
  checking: 'checking…',
  available: 'available',
  taken: 'already taken',
  invalid: '3–20 chars, letters numbers and _ only',
  'check-failed': '',   // allow submit anyway; server will catch real duplicates
}

const STATUS_COLOR: Record<Status, string> = {
  idle: 'var(--sub)',
  checking: 'var(--sub)',
  available: '#4caf50',
  taken: 'var(--error)',
  invalid: 'var(--error)',
  'check-failed': 'var(--sub)',
}

export function UsernameModal({ isOpen, onClose }: UsernameModalProps) {
  const { currentUser } = useAuth()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Debounced availability check — 300ms feels snappy
  useEffect(() => {
    if (!value) { setStatus('idle'); return }
    if (!USERNAME_RE.test(value)) { setStatus('invalid'); return }
    setStatus('checking')
    const t = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(value)
        setStatus(available ? 'available' : 'taken')
      } catch {
        // Firestore read failed (likely security rules on usernames collection).
        // Fall back to 'check-failed' — the server transaction is the real guard.
        setStatus('check-failed')
      }
    }, 300)
    return () => clearTimeout(t)
  }, [value])

  useEffect(() => {
    if (isOpen) { setValue(''); setStatus('idle'); setError('') }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || loading) return
    // Allow submit if available or if availability check couldn't run
    if (status !== 'available' && status !== 'check-failed') return
    if (!USERNAME_RE.test(value)) return

    setLoading(true)
    setError('')
    try {
      const result = await setUsername(currentUser.uid, value)
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'something went wrong')
        setStatus('taken')
      }
    } catch (err) {
      setError('failed to save — check your connection and try again')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  const canSubmit = !loading && USERNAME_RE.test(value) &&
    (status === 'available' || status === 'check-failed')
  const borderColor = value
    ? (STATUS_COLOR[status] ?? 'var(--sub)')
    : 'var(--sub)'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full font-mono"
        style={{
          maxWidth: 380,
          margin: '0 16px',
          backgroundColor: 'var(--bg2)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors"
          style={{
            top: 14, right: 14,
            color: 'var(--sub)', background: 'none', border: 'none',
            cursor: 'pointer', width: 28, height: 28, fontSize: 20, lineHeight: 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
        >
          ×
        </button>

        <h2 className="mb-1.5" style={{ color: 'var(--text)', fontSize: 18, fontWeight: 500 }}>
          choose your username
        </h2>
        <p className="mb-7" style={{ color: 'var(--sub)', fontSize: 13 }}>
          this is how you'll appear on leaderboards and your profile
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="username"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\s/g, ''))}
            maxLength={20}
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
            className="font-mono text-sm w-full outline-none"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              borderRadius: 8,
              padding: '10px 14px',
              border: `1px solid ${borderColor}`,
              fontSize: 14,
              transition: 'border-color 0.15s',
            }}
          />

          {/* Status line */}
          {value && STATUS_TEXT[status] && (
            <p style={{ color: STATUS_COLOR[status], fontSize: 12, marginTop: -4 }}>
              {STATUS_TEXT[status]}
            </p>
          )}
          {error && (
            <p style={{ color: 'var(--error)', fontSize: 12, marginTop: -4 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full font-mono font-medium transition-all"
            style={{
              backgroundColor: canSubmit ? 'var(--main)' : 'transparent',
              color: canSubmit ? 'var(--bg)' : 'var(--sub)',
              borderRadius: 8,
              padding: '10px 16px',
              border: `1px solid ${canSubmit ? 'transparent' : 'var(--sub)'}`,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontSize: 14,
              marginTop: 4,
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            {loading ? 'saving…' : 'set username'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="font-mono text-center transition-opacity hover:opacity-80"
            style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
