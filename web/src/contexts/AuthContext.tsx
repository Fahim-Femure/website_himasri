import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { Role, UserDoc, UserStatus } from '@/types/models';
import { toDate } from '@/utils/format';

interface AuthContextValue {
  user: User | null;
  profile: UserDoc | null;
  role: Role | null;
  status: UserStatus | null;
  loading: boolean;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  status: null,
  loading: true,
  refreshClaims: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [claimRole, setClaimRole] = useState<Role | null>(null);
  const [claimStatus, setClaimStatus] = useState<UserStatus | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  const lastClaimsTsRef = useRef<number | null>(null);

  const syncTokenClaims = useCallback(async (firebaseUser: User, force = false) => {
    try {
      const tokenRes = await firebaseUser.getIdTokenResult(force);
      const r = tokenRes.claims.role as Role | undefined;
      const s = tokenRes.claims.status as UserStatus | undefined;
      setClaimRole(r ?? null);
      setClaimStatus(s ?? null);
    } catch {
      // Ignore transient errors during signOut/deletion
    }
  }, []);

  const refreshClaims = useCallback(async () => {
    if (auth.currentUser) {
      await syncTokenClaims(auth.currentUser, true);
    }
  }, [syncTokenClaims]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      lastClaimsTsRef.current = null;
      if (!nextUser) {
        setProfile(null);
        setClaimRole(null);
        setClaimStatus(null);
        setProfileReady(true);
        setAuthReady(true);
        return;
      }

      setProfileReady(false);
      await syncTokenClaims(nextUser, false);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [syncTokenClaims]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileReady(true);
      return;
    }

    const userRef = doc(db, `users/${user.uid}`);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Omit<UserDoc, 'uid'>;
          const fullProfile: UserDoc = { uid: snap.id, ...data };
          setProfile(fullProfile);

          const tsMs = toDate(data.claimsUpdatedAt)?.getTime() ?? null;
          if (tsMs !== null) {
            if (lastClaimsTsRef.current !== null && lastClaimsTsRef.current !== tsMs) {
              void syncTokenClaims(user, true);
            }
            lastClaimsTsRef.current = tsMs;
          }
        } else {
          setProfile(null);
        }
        setProfileReady(true);
      },
      () => {
        setProfileReady(true);
      },
    );

    return () => unsub();
  }, [user, syncTokenClaims]);

  const role: Role | null = claimRole ?? profile?.role ?? null;
  const status: UserStatus | null = profile?.status ?? claimStatus ?? null;
  const loading = !authReady || (Boolean(user) && !profileReady);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        status,
        loading,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
