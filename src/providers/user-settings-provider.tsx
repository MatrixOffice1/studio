'use client';

import { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserSettings = {
  aiProvider?: 'gemini' | 'openai';
  apiKey?: string;
  n8nWebhook?: string;
  [key: string]: any;
};

export interface UserSettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  updateSettings: (newSettings: UserSettings) => Promise<void>;
  user: User | null;
}

export const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndSettings = async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', currentUser.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
            throw error;
          }
          setSettings(data?.settings || {});
        } catch (error) {
          console.error("Error fetching user settings:", error);
          setSettings({}); // Default to empty settings on error
        }
      } else {
        setSettings(null); // If no user, settings are null.
      }
      setLoading(false);
    };
    
    // Immediately check for a user session
    supabase.auth.getSession().then(({ data: { session } }) => {
        fetchUserAndSettings(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      fetchUserAndSettings(currentUser);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const updateSettings = useCallback(async (newSettings: UserSettings) => {
    if (!user) {
      throw new Error("User must be logged in to update settings.");
    }

    const currentSettings = settings || {};

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: user.id,
        settings: { ...currentSettings, ...newSettings },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      throw error;
    }
    
    // Refresh settings after update
    setSettings(prev => ({...prev, ...newSettings}));
  }, [user, settings]);

  const value = { settings, loading, updateSettings, user };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}
