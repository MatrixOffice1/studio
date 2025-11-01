'use client';

import { AgendaView } from '@/components/dashboard/agenda-view';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AppointmentsPage() {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-muted/20">
      <AgendaView />
    </div>
  );
}
