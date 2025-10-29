
"use client";

import { createContext, useContext } from 'react';
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
