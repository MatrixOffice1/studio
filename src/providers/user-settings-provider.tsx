
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
    setIsLoading(true);

    // 1. Find the admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (adminError || !adminProfile) {
      console.error('Could not find admin user to load settings:', adminError?.message);
      setSettings(null);
      setIsLoading(false);
      return;
    }

    // 2. Fetch the admin's settings using the found admin ID
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', adminProfile.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is a valid empty state
      console.error("Error fetching admin's user settings:", error);
      setSettings(null);
    } else {
      setSettings(data?.settings || {}); // Provide settings or an empty object
    }
    setIsLoading(false);
  }, []);

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
