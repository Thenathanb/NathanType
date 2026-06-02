import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getRedirectResult, onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export interface UserProfile {
  displayName: string
  username: string
  email: string
  photoURL: string | null
  provider: 'google' | 'github' | 'email'
  createdAt: number
  level: number
  xp: number
  xpToNextLevel: number
  totalTests: number
  testsStarted: number
  totalTimeTyping: number
  currentStreak: number
  bestStreak: number
  lastTestDate: number | null
  friends: Array<{ uid: string; since: number }>
  preferences: {
    defaultMode: string
    defaultTimeLimit: number
    defaultWordLimit: number
    streakHourOffset: number
  }
  bestWpm: {
    time15: number
    time30: number
    time60: number
    time120: number
    words10: number
    words25: number
    words50: number
    words100: number
  }
  bestWpmDates: {
    time15: number | null
    time30: number | null
    time60: number | null
    time120: number | null
    words10: number | null
    words25: number | null
    words50: number | null
    words100: number | null
  }
}

interface AuthContextValue {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  userProfile: null,
  loading: true,
})

// ── Profile cache helpers (localStorage) ─────────────────────────
// Saves the profile so /account renders instantly from cache on next visit.
const cacheKey = (uid: string) => `nt-profile-${uid}`

function readCache(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

function writeCache(uid: string, profile: UserProfile): void {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(profile))
  } catch { /* storage full — ignore */ }
}

function clearCache(uid: string): void {
  try { localStorage.removeItem(cacheKey(uid)) } catch { /* ignore */ }
}

// ── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser]   = useState<User | null>(null)
  const [userProfile, setUserProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]           = useState(true)
  const unsubSnapshotRef                = useRef<(() => void) | null>(null)

  // Handle the result of a signInWithRedirect call.
  // Must run once on mount before onAuthStateChanged to catch errors
  // (e.g. user denied GitHub permission, unauthorized domain).
  useEffect(() => {
    getRedirectResult(auth).catch((err: unknown) => {
      const code = (err as { code?: string }).code ?? ''
      // auth/popup-closed-by-user and cancelled are non-errors — skip them
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      console.error('[OAuth redirect error]', err)
    })
  }, [])

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubSnapshotRef.current) {
        unsubSnapshotRef.current()
        unsubSnapshotRef.current = null
      }

      setCurrentUser(user)

      if (!user) {
        setUserProfile(null)
        setLoading(false)
        return
      }

      // Auth state is now known — unblock ProtectedRoute immediately.
      // Firestore profile loading continues asynchronously below.
      setLoading(false)

      // ── 1. Serve cached profile immediately (0 ms) ──────────────
      const cached = readCache(user.uid)
      if (cached) {
        setUserProfile(cached)
      }

      const userRef = doc(db, 'users', user.uid)

      // ── 2. Real-time snapshot — skips the blocking getDoc round-trip.
      //       Only create the user doc when the SERVER (not local cache) confirms
      //       it doesn't exist. This prevents overwriting createdAt on devices
      //       that have an empty offline cache for a user who already has a doc.
      unsubSnapshotRef.current = onSnapshot(userRef, async (snap) => {
        if (snap.exists()) {
          const profile = snap.data() as UserProfile
          setUserProfile(profile)
          writeCache(user.uid, profile)
          setLoading(false)
        } else if (!snap.metadata.fromCache) {
          // Server confirmed the document is absent — this is a genuine new user.
          try {
            const providerId = user.providerData[0]?.providerId
            const provider: UserProfile['provider'] =
              providerId === 'google.com' ? 'google' :
              providerId === 'github.com' ? 'github' : 'email'

            const newProfile: UserProfile = {
              displayName: user.displayName || user.email?.split('@')[0] || 'anonymous',
              username: '',
              email: user.email || '',
              photoURL: user.photoURL || null,
              provider,
              createdAt: Date.now(),
              level: 1,
              xp: 0,
              xpToNextLevel: 100,
              totalTests: 0,
              testsStarted: 0,
              totalTimeTyping: 0,
              currentStreak: 0,
              bestStreak: 0,
              lastTestDate: null,
              friends: [],
              preferences: { defaultMode: 'time', defaultTimeLimit: 30, defaultWordLimit: 25, streakHourOffset: 0 },
              bestWpm: { time15: 0, time30: 0, time60: 0, time120: 0, words10: 0, words25: 0, words50: 0, words100: 0 },
              bestWpmDates: { time15: null, time30: null, time60: null, time120: null, words10: null, words25: null, words50: null, words100: null },
            }
            await setDoc(userRef, newProfile)
            // Snapshot re-fires automatically after setDoc — no manual setUserProfile needed.
          } catch (err) {
            console.error('Failed to initialize user document:', err)
          }
          // If fromCache === true && !snap.exists(): the offline cache has a stale
          // "missing" entry. Wait for the server snapshot before acting.
        }
      }, (err) => {
        console.error('Firestore snapshot error:', err)
      })
    })

    return () => {
      unsubAuth()
      if (unsubSnapshotRef.current) unsubSnapshotRef.current()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

/** Call on sign-out to wipe the local profile cache. */
export function clearProfileCache(uid: string) {
  clearCache(uid)
}
