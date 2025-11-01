
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
  adminUserId: string | null; // Expose the admin user ID for saving
  userSpecificSettings: Pick<UserSettings, 'sync_interval'> | null;
  saveUserSpecificSettings: (settings: Pick<UserSettings, 'sync_interval'>) => Promise<void>;
};

export const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children, userId }: { children: ReactNode, userId?: string }) {
  const [adminSettings, setAdminSettings] = useState<UserSettings | null>(null);
  const [userSpecificSettings, setUserSpecificSettings] = useState<Pick<UserSettings, 'sync_interval'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);

    // 1. Find the primary admin user (assuming the first created admin)
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (adminError || !adminProfile) {
      console.error('Could not find admin user to load settings:', adminError?.message);
      setAdminSettings({});
      setAdminUserId(null);
    } else {
      setAdminUserId(adminProfile.id);
      // 2. Fetch the admin's settings using the found admin ID
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', adminProfile.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching admin's user settings:", error);
        setAdminSettings({});
      } else {
        setAdminSettings(data?.settings || {});
      }
    }

    // 3. Fetch user-specific settings for the logged-in user
    if (userId) {
        const { data: userSettingsData, error: userSettingsError } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', userId)
            .single();
        
        if (userSettingsData?.settings) {
            setUserSpecificSettings({
                sync_interval: userSettingsData.settings.sync_interval
            });
        } else {
            setUserSpecificSettings({});
        }
    }

    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveUserSpecificSettings = async (newSettings: Pick<UserSettings, 'sync_interval'>) => {
    if (!userId) {
        throw new Error("User is not logged in.");
    }

    const { data: existingSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
    }

    const finalSettings = { ...(existingSettings?.settings || {}), ...newSettings };

    const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, settings: finalSettings }, { onConflict: 'user_id' });

    if (error) {
        throw error;
    }
    
    setUserSpecificSettings(current => ({...current, ...newSettings}));
  };

  const value: UserSettingsContextType = {
    settings: adminSettings,
    isLoading,
    refreshSettings: fetchSettings,
    adminUserId,
    userSpecificSettings,
    saveUserSpecificSettings,
  };

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}
