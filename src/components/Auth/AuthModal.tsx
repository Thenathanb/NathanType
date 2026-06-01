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

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Reset to sign-in when reopened
  useEffect(() => { if (isOpen) setMode('signin') }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full font-mono"
        style={{ maxWidth: 380, margin: '0 16px', backgroundColor: '#323437', borderRadius: 12, padding: 32 }}
        onMouseDown={(e) => e.stopPropagation()}
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

        {/* Mode toggle */}
        <div className="flex gap-6 mb-7">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="font-mono text-sm font-medium transition-colors pb-1"
              style={{
                color: mode === m ? '#e2b714' : '#646669',
                background: 'none',
                border: 'none',
                borderBottom: mode === m ? '2px solid #e2b714' : '2px solid transparent',
                cursor: 'pointer',
                padding: '0 0 4px 0',
              }}
            >
              {m === 'signin' ? 'sign in' : 'create account'}
            </button>
          ))}
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3 mb-5">
          <GoogleButton onSuccess={onClose} />
          <GitHubButton onSuccess={onClose} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1" style={{ height: 1, backgroundColor: '#646669', opacity: 0.3 }} />
          <span style={{ color: '#646669', fontSize: 13 }}>or</span>
          <div className="flex-1" style={{ height: 1, backgroundColor: '#646669', opacity: 0.3 }} />
        </div>

        {/* Email form */}
        <EmailForm mode={mode} onSuccess={onClose} />
      </div>
    </div>
  )
}
