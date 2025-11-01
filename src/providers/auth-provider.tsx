'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return null;
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
        return null;
      }
      setProfile(profileData);
      return profileData;
    } catch (e) {
      console.error('Exception fetching profile', e);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setUser(initialSession?.user ?? null);
      setSession(initialSession);
      if (initialSession?.user) {
        await fetchProfile(initialSession.user);
      }
      setIsLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setUser(newSession?.user ?? null);
          setSession(newSession);
          if (newSession?.user) {
            await fetchProfile(newSession.user);
          } else {
            setProfile(null);
          }
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    };

    const unsubscribe = getInitialSession();

    return () => {
      unsubscribe.then(cleanup => cleanup && cleanup());
    };
  }, [fetchProfile]);


  const refreshProfileCallback = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  const value = {
    user,
    session,
    profile,
    isLoading,
    refreshProfile: refreshProfileCallback,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
