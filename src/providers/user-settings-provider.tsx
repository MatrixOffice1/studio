'use client';

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type UserSettings = {
  gemini_api_key?: string;
  // Add other settings fields here
};

type UserSettingsContextType = {
  settings: UserSettings | null;
  isLoading: boolean;
  refreshSettings: (() => void) | null;
};

export const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children, userId }: { children: ReactNode, userId?: string }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setSettings(null);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user settings:', error);
      setSettings(null);
    } else {
      setSettings(data);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = {
    settings,
    isLoading,
    refreshSettings: fetchSettings,
  };

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}
