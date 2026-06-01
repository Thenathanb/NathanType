import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../../firebase'

interface EmailFormProps {
  mode: 'signin' | 'signup'
  onSuccess: () => void
}

const ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'no account found with that email',
  'auth/wrong-password': 'incorrect password',
  'auth/invalid-credential': 'incorrect email or password',
  'auth/email-already-in-use': 'an account with this email already exists',
  'auth/weak-password': 'password must be at least 6 characters',
  'auth/invalid-email': 'please enter a valid email address',
  'auth/too-many-requests': 'too many attempts — try again later',
}

export function EmailForm({ mode, onSuccess }: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: email.split('@')[0] })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      onSuccess()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || ''
      setError(ERROR_MESSAGES[code] || 'something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('enter your email first'); return }
    setError('')
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || ''
      setError(ERROR_MESSAGES[code] || 'failed to send reset email')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="font-mono text-sm w-full outline-none"
        style={{
          backgroundColor: '#2c2e31',
          color: '#d1d0ce',
          borderRadius: 8,
          padding: '10px 14px',
          border: '1px solid #646669',
          fontSize: 14,
        }}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="font-mono text-sm w-full outline-none"
        style={{
          backgroundColor: '#2c2e31',
          color: '#d1d0ce',
          borderRadius: 8,
          padding: '10px 14px',
          border: '1px solid #646669',
          fontSize: 14,
        }}
      />
      {mode === 'signup' && (
        <input
          type="password"
          placeholder="confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="font-mono text-sm w-full outline-none"
          style={{
            backgroundColor: '#2c2e31',
            color: '#d1d0ce',
            borderRadius: 8,
            padding: '10px 14px',
            border: '1px solid #646669',
            fontSize: 14,
          }}
        />
      )}

      {error && (
        <p className="font-mono text-sm" style={{ color: '#ca4754', fontSize: 13 }}>
          {error}
        </p>
      )}
      {resetSent && (
        <p className="font-mono text-sm" style={{ color: '#e2b714', fontSize: 13 }}>
          reset email sent — check your inbox
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full font-mono text-sm font-medium transition-opacity hover:opacity-90"
        style={{
          backgroundColor: '#e2b714',
          color: '#2c2e31',
          borderRadius: 8,
          padding: '10px 16px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'please wait…' : mode === 'signup' ? 'create account' : 'sign in'}
      </button>

      {mode === 'signin' && (
        <button
          type="button"
          onClick={handleForgotPassword}
          className="font-mono text-sm text-center transition-opacity hover:opacity-80"
          style={{ color: '#646669', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          forgot password?
        </button>
      )}
    </form>
  )
}
