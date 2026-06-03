import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export interface PersonalBestEntry {
  wpm: number
  raw: number
  acc: number
  consistency: number
  timestamp: number
}

export interface UserProfile {
  displayName: string
  username: string
  email: string
  photoURL: string | null
  provider: 'google' | 'github' | 'email'
  addedAt: number          // creation timestamp (primary)
  createdAt?: number       // legacy alias — read-only, never write after addedAt exists
  level: number
  xp: number
  xpToNextLevel: number

  // Monkeytype-style counter field names
  startedTests: number
  completedTests: number
  timeTyping: number       // total seconds typed

  // Streak (Monkeytype nested structure)
  streak: {
    length: number
    maxLength: number
    lastResultTimestamp: number
  }

  // Personal bests (Monkeytype nested structure)
  personalBests: {
    time: Partial<Record<string, PersonalBestEntry>>
    words: Partial<Record<string, PersonalBestEntry>>
  }

  friends: Array<{ uid: string; since: number }>
  preferences: {
    defaultMode: string
    defaultTimeLimit: number
    defaultWordLimit: number
    streakHourOffset: number
  }

  // Legacy fields — kept for backward compat reads; never written after migration
  testsStarted?: number
  totalTests?: number
  totalTimeTyping?: number
  currentStreak?: number
  bestStreak?: number
  lastTestDate?: number | null
  bestWpm?: { time15: number; time30: number; time60: number; time120: number; words10: number; words25: number; words50: number; words100: number }
  bestWpmDates?: { time15: number | null; time30: number | null; time60: number | null; time120: number | null; words10: number | null; words25: number | null; words50: number | null; words100: number | null }
}

export function getCompletedTests(p: UserProfile): number {
  return p.completedTests ?? p.totalTests ?? 0
}
export function getStartedTests(p: UserProfile): number {
  return p.startedTests ?? p.testsStarted ?? 0
}
export function getTimeTyping(p: UserProfile): number {
  return p.timeTyping ?? p.totalTimeTyping ?? 0
}
export function getStreakLength(p: UserProfile): number {
  return p.streak?.length ?? p.currentStreak ?? 0
}
export function getStreakMax(p: UserProfile): number {
  return p.streak?.maxLength ?? p.bestStreak ?? 0
}
export function getAddedAt(p: UserProfile): number {
  return p.addedAt ?? p.createdAt ?? Date.now()
}
export function getPbEntry(p: UserProfile, mode: 'time' | 'words', mode2: string): PersonalBestEntry | null {
  // Check new schema first
  const newPb = p.personalBests?.[mode]?.[mode2]
  if (newPb) return newPb
  // Fall back to legacy flat bestWpm
  const legacyKey = `${mode}${mode2}` as keyof NonNullable<UserProfile['bestWpm']>
  const legacyWpm = p.bestWpm?.[legacyKey]
  if (legacyWpm && legacyWpm > 0) {
    const dateKey = legacyKey as keyof NonNullable<UserProfile['bestWpmDates']>
    return {
      wpm: legacyWpm,
      raw: legacyWpm,
      acc: 0,
      consistency: 0,
      timestamp: p.bestWpmDates?.[dateKey] ?? 0,
    }
  }
  return null
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
      //       it doesn't exist. This prevents overwriting addedAt on devices
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
              addedAt: Date.now(),
              level: 1,
              xp: 0,
              xpToNextLevel: 100,
              startedTests: 0,
              completedTests: 0,
              timeTyping: 0,
              streak: { length: 0, maxLength: 0, lastResultTimestamp: 0 },
              personalBests: { time: {}, words: {} },
              friends: [],
              preferences: { defaultMode: 'time', defaultTimeLimit: 30, defaultWordLimit: 25, streakHourOffset: 0 },
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
