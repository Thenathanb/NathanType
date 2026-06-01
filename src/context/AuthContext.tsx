import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const unsubSnapshotRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      // Unsubscribe from previous user's snapshot
      if (unsubSnapshotRef.current) {
        unsubSnapshotRef.current()
        unsubSnapshotRef.current = null
      }

      setCurrentUser(user)

      if (user) {
        const userRef = doc(db, 'users', user.uid)

        try {
          const snap = await getDoc(userRef)
          if (!snap.exists()) {
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
          }
        } catch (err) {
          console.error('Failed to initialize user document:', err)
        }

        // Subscribe to real-time profile updates
        unsubSnapshotRef.current = onSnapshot(userRef, (snap) => {
          if (snap.exists()) setUserProfile(snap.data() as UserProfile)
        }, (err) => {
          console.error('Firestore snapshot error:', err)
        })
      } else {
        setUserProfile(null)
      }

      setLoading(false)
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
