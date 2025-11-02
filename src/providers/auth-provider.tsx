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
      // Don't set loading to true here initially, let the onAuthStateChange handle it.
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      // If there's no session, we are done loading.
      if (!initialSession) {
        setIsLoading(false);
      }
      
      setUser(initialSession?.user ?? null);
      setSession(initialSession);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setIsLoading(true);
          const newUser = newSession?.user ?? null;
          setUser(newUser);
          setSession(newSession);
          
          if (newUser) {
            await fetchProfile(newUser);
          } else {
            setProfile(null);
          }
          setIsLoading(false);
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    };

    getInitialSession();
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
