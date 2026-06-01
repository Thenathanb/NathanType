import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { checkUsernameAvailable, setUsername } from '../../utils/firestoreService'

interface UsernameModalProps {
  isOpen: boolean
  onClose: () => void
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

const STATUS_TEXT: Record<Status, string> = {
  idle: '',
  checking: 'checking…',
  available: 'available ✓',
  taken: 'already taken',
  invalid: '3–20 chars, letters, numbers and underscores only',
}

const STATUS_COLOR: Record<Status, string> = {
  idle: '#646669',
  checking: '#646669',
  available: '#4caf50',
  taken: '#ca4754',
  invalid: '#ca4754',
}

export function UsernameModal({ isOpen, onClose }: UsernameModalProps) {
  const { currentUser } = useAuth()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Debounced Firestore availability check
  useEffect(() => {
    if (!value) { setStatus('idle'); return }
    if (!USERNAME_RE.test(value)) { setStatus('invalid'); return }
    setStatus('checking')
    const t = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(value)
        setStatus(available ? 'available' : 'taken')
      } catch {
        setStatus('idle')
      }
    }, 500)
    return () => clearTimeout(t)
  }, [value])

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) { setValue(''); setStatus('idle'); setError('') }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || status !== 'available' || loading) return
    setLoading(true)
    setError('')
    const result = await setUsername(currentUser.uid, value)
    setLoading(false)
    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'something went wrong')
      setStatus('taken')
    }
  }

  if (!isOpen) return null

  const canSubmit = status === 'available' && !loading
  const borderColor = value ? STATUS_COLOR[status] : '#646669'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="relative w-full font-mono"
        style={{ maxWidth: 380, margin: '0 16px', backgroundColor: '#323437', borderRadius: 12, padding: 32 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors"
          style={{ top: 14, right: 14, color: '#646669', background: 'none', border: 'none', cursor: 'pointer', width: 28, height: 28, fontSize: 20, lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d1d0ce')}
          onMouseLeave={e => (e.currentTarget.style.color = '#646669')}
        >
          ×
        </button>

        <h2 className="mb-1.5" style={{ color: '#d1d0ce', fontSize: 18, fontWeight: 500 }}>
          choose your username
        </h2>
        <p className="mb-7" style={{ color: '#646669', fontSize: 13 }}>
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
              backgroundColor: '#2c2e31',
              color: '#d1d0ce',
              borderRadius: 8,
              padding: '10px 14px',
              border: `1px solid ${borderColor}`,
              fontSize: 14,
              transition: 'border-color 0.15s',
            }}
          />

          {value && STATUS_TEXT[status] && (
            <p style={{ color: STATUS_COLOR[status], fontSize: 12, marginTop: -4 }}>
              {STATUS_TEXT[status]}
            </p>
          )}
          {error && (
            <p style={{ color: '#ca4754', fontSize: 12, marginTop: -4 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full font-mono font-medium transition-all"
            style={{
              backgroundColor: canSubmit ? '#e2b714' : 'transparent',
              color: canSubmit ? '#2c2e31' : '#646669',
              borderRadius: 8,
              padding: '10px 16px',
              border: `1px solid ${canSubmit ? 'transparent' : '#646669'}`,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {loading ? 'saving…' : 'set username'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="font-mono text-center transition-opacity hover:opacity-80"
            style={{ color: '#646669', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
