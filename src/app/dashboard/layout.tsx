
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserSettingsProvider } from '@/providers/user-settings-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserSettingsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UserSettingsProvider>
  );
}
