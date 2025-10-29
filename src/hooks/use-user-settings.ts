'use client';

import { useContext } from 'react';
import { UserSettingsContext } from '@/providers/user-settings-provider';

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}
