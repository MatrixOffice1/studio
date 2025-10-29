
'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { UserSettingsContext, type UserSettings } from '@/hooks/use-user-settings';

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchSettings = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
          throw error;
        }

        setSettings(data?.settings || {});
      } catch (error) {
        console.error("Error fetching user settings:", error);
        setSettings({}); // Default to empty settings on error
      } finally {
        setLoading(false);
      }
    } else {
        setLoading(false);
        setSettings(null); // If no user, settings are null.
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: UserSettings) => {
    if (!user) {
      throw new Error("User must be logged in to update settings.");
    }

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: user.id,
        settings: { ...settings, ...newSettings },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      throw error;
    }
    
    // Refresh settings after update
    await fetchSettings();
  }, [user, settings, fetchSettings]);

  const value = { settings, loading, updateSettings, user };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}
