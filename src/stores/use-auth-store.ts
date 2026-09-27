import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { configureHttpAuth } from "@/lib/api/client/http";
import type { AuthSession, User } from "@/types/auth";

interface AuthState {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      setUser: (user) =>
        set((s) => (s.session ? { session: { ...s.session, user } } : s)),
      clear: () => set({ session: null }),
    }),
    {
      name: "pasupasastra.auth",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ session: s.session }),
    },
  ),
);

export function isSessionValid(
  session: AuthSession | null,
): session is AuthSession {
  return (
    !!session && (session.expiresAt === null || session.expiresAt > Date.now())
  );
}

// Bearer token for every axios request; a 401 clears the session and the
// auth guard sends the operator back to the login screen.
configureHttpAuth({
  getToken: () => {
    const session = useAuthStore.getState().session;
    return isSessionValid(session) ? session.accessToken : null;
  },
  onUnauthorized: () => useAuthStore.getState().clear(),
});
