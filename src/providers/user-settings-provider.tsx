'use client';

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// The 'settings' column is a single JSONB object.
// This type can be expanded as more settings are added.
export type UserSettings = {
  aiProvider?: string;
  gemini_api_key?: string;
  agenda_webhook_url?: string;
  availability_webhook_url?: string;
  citas_webhook_url?: string;
  clients_webhook_url?: string;
  pdf_webhook_url?: string;
  sheet_webhook_url?: string;
  sync_interval?: number;
  [key: string]: any; // Allow other string keys
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
    // Select the whole row, specifically the 'settings' column which is JSONB
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user settings:', error);
      setSettings(null);
    } else {
      // The 'settings' field from the DB is the JSON object
      setSettings(data?.settings || {});
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
