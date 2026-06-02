import { useEffect, useState } from 'react'
import { EmailForm } from './EmailForm'
import { GitHubButton } from './GitHubButton'
import { GoogleButton } from './GoogleButton'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [oauthError, setOauthError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Reset to sign-in when reopened
  useEffect(() => {
    if (isOpen) { setMode('signin'); setOauthError('') }
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

        {/* Mode toggle */}
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
      </div>
    </div>
  )
}
