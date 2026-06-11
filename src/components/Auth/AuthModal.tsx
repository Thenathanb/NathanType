import { useEffect, useState } from 'react'
import { EmailForm } from './EmailForm'
import { GitHubButton } from './GitHubButton'
import { GoogleButton } from './GoogleButton'
import { PhoneForm } from './PhoneForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'signin' | 'signup'
type Method = 'email' | 'phone'

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [method, setMethod] = useState<Method>('email')
  const [oauthError, setOauthError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Reset state when reopened
  useEffect(() => {
    if (isOpen) { setMode('signin'); setMethod('email'); setOauthError('') }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full font-mono"
        style={{ maxWidth: 380, margin: '0 16px', backgroundColor: 'var(--bg2)', borderRadius: 12, padding: 32 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors"
          style={{ top: 14, right: 14, color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer', width: 28, height: 28, fontSize: 20, lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
        >
          ×
        </button>

        {/* Mode toggle (only shown for email method) */}
        {method === 'email' && (
          <div className="flex gap-6 mb-7">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setOauthError('') }}
                className="font-mono text-sm font-medium transition-colors pb-1"
                style={{
                  color: mode === m ? 'var(--main)' : 'var(--sub)',
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === m ? '2px solid var(--main)' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: '0 0 4px 0',
                }}
              >
                {m === 'signin' ? 'sign in' : 'create account'}
              </button>
            ))}
          </div>
        )}

        {method === 'phone' && (
          <div className="mb-7">
            <button
              onClick={() => setMethod('email')}
              className="font-mono text-sm transition-colors"
              style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              ← back
            </button>
            <p className="font-mono mt-3" style={{ color: 'var(--text)', fontSize: 15, fontWeight: 500 }}>phone sign-in</p>
          </div>
        )}

        {method === 'email' && (
          <>
            {/* OAuth buttons */}
            <div className="flex flex-col gap-3 mb-4">
              <GoogleButton onSuccess={onClose} onError={setOauthError} />
              <GitHubButton onSuccess={onClose} onError={setOauthError} />
            </div>

            {/* OAuth error */}
            {oauthError && (
              <p className="font-mono mb-4" style={{ color: 'var(--error)', fontSize: 13 }}>
                {oauthError}
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--sub)', opacity: 0.3 }} />
              <span style={{ color: 'var(--sub)', fontSize: 13 }}>or</span>
              <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--sub)', opacity: 0.3 }} />
            </div>

            {/* Email form */}
            <EmailForm mode={mode} onSuccess={onClose} />

            {/* Phone link */}
            <button
              onClick={() => setMethod('phone')}
              className="w-full font-mono text-sm text-center mt-4 transition-opacity hover:opacity-80"
              style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              sign in with phone number
            </button>
          </>
        )}

        {method === 'phone' && (
          <PhoneForm onSuccess={onClose} />
        )}
      </div>
    </div>
  )
}
