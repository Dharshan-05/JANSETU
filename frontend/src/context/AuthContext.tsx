import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'citizen' | 'analyst' | 'administrator';
  displayName?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  signIn: (role?: 'citizen' | 'analyst' | 'administrator') => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
  getIdToken: async () => null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if live Firebase auth listener is available
    if (auth && typeof onAuthStateChanged === 'function') {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
          if (user) {
            const token = await user.getIdToken();
            setCurrentToken(token);
            setCurrentUser({
              uid: user.uid,
              email: user.email || 'user@jansetu.gov.in',
              role: 'citizen',
              displayName: user.displayName || 'Authenticated Citizen'
            });
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (err) {
        console.warn("Firebase Auth state observer disabled:", err);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (role: 'citizen' | 'analyst' | 'administrator' = 'citizen') => {
    setLoading(true);
    // Phase 1 provides instant role-based token acquisition for demonstration & testing
    const token = `test-token-${role}`;
    setCurrentToken(token);
    setCurrentUser({
      uid: `usr_${role}_001`,
      email: `${role}@jansetu.gov.in`,
      role: role,
      displayName: role.charAt(0).toUpperCase() + role.slice(1) + ' Officer'
    });
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    setCurrentUser(null);
    setCurrentToken(null);
    setLoading(false);
  };

  const getIdToken = async (): Promise<string | null> => {
    return currentToken;
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
