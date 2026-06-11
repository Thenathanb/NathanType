import { useEffect, useRef, useState } from 'react'
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth'
import { auth } from '../../firebase'

interface PhoneFormProps {
  onSuccess: () => void
}

export function PhoneForm({ onSuccess }: PhoneFormProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear()
    }
  }, [])

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, containerRef.current!, {
          size: 'invisible',
        })
      }
      confirmationRef.current = await signInWithPhoneNumber(auth, phone, recaptchaRef.current)
      setStep('code')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || ''
      setError(
        code === 'auth/invalid-phone-number' ? 'invalid phone number — include country code (e.g. +1...)' :
        code === 'auth/too-many-requests' ? 'too many attempts — try again later' :
        `failed to send code (${code || 'unknown error'})`
      )
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmationRef.current) return
    setError('')
    setLoading(true)
    try {
      const credential = PhoneAuthProvider.credential(
        (confirmationRef.current as unknown as { verificationId: string }).verificationId,
        code
      )
      await signInWithCredential(auth, credential)
      onSuccess()
    } catch (err: unknown) {
      const c = (err as { code?: string }).code || ''
      setError(
        c === 'auth/invalid-verification-code' ? 'incorrect code — please try again' :
        c === 'auth/code-expired' ? 'code expired — request a new one' :
        `verification failed (${c || 'unknown error'})`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* invisible reCAPTCHA anchor */}
      <div ref={containerRef} />

      {step === 'phone' ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <input
            type="tel"
            placeholder="+1 555 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          {error && <p className="font-mono" style={{ color: '#ca4754', fontSize: 13 }}>{error}</p>}
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
            {loading ? 'sending…' : 'send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <p className="font-mono" style={{ color: 'var(--sub)', fontSize: 13 }}>
            code sent to {phone}
          </p>
          <input
            type="text"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            inputMode="numeric"
            className="font-mono text-sm w-full outline-none"
            style={{
              backgroundColor: '#2c2e31',
              color: '#d1d0ce',
              borderRadius: 8,
              padding: '10px 14px',
              border: '1px solid #646669',
              fontSize: 14,
              letterSpacing: '0.2em',
            }}
          />
          {error && <p className="font-mono" style={{ color: '#ca4754', fontSize: 13 }}>{error}</p>}
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
            {loading ? 'verifying…' : 'verify'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('phone'); setCode(''); setError('') }}
            className="font-mono text-sm text-center transition-opacity hover:opacity-80"
            style={{ color: '#646669', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            use a different number
          </button>
        </form>
      )}
    </div>
  )
}
