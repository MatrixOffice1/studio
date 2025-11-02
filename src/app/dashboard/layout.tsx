'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { UserSettingsProvider } from '@/providers/user-settings-provider';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && profile && pathname === '/dashboard') {
        // Redirect to the correct initial page after login
        if (profile.is_admin) {
            router.replace('/dashboard/messages');
        } else {
            router.replace('/dashboard/appointments');
        }
    }
  }, [user, profile, isLoading, router, pathname]);

  if (isLoading && !user) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      );
  }

  // If we are not loading and there's no user, the effect will redirect.
  // We can return null or a loader to prevent a flicker.
  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Show a top-level loader while auth state is initially resolving,
  // but once the user object exists, we can proceed.
  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If a user is resolved, we can safely render the UserSettingsProvider
  // The inner DashboardContent will handle redirects if the session is invalid
  return (
    <UserSettingsProvider userId={user?.id}>
      <DashboardContent>
        {children}
      </DashboardContent>
    </UserSettingsProvider>
  );
}
