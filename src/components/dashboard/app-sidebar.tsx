"use client"

import {
  BarChart3,
  CalendarDays,
  LogOut,
  MessagesSquare,
  Settings,
  User,
  Users,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useAuth } from "@/providers/auth-provider"
import { supabase } from "@/lib/supabase"

const menuItems = [
  { href: "/dashboard/messages", label: "Mensajes", icon: MessagesSquare, adminOnly: true },
  { href: "/dashboard/analytics", label: "Analíticas", icon: BarChart3, adminOnly: true },
  { href: "/dashboard/appointments", label: "Agenda", icon: CalendarDays, adminOnly: false },
  { href: "/dashboard/clients", label: "Clientes", icon: Users, adminOnly: true },
  { href: "/dashboard/invoices", label: "Facturas", icon: Wallet, adminOnly: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter();
  const { profile } = useAuth();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/dashboard/messages";
    return pathname.startsWith(href);
  }
  
  const userEmail = profile?.email || 'user@peluflow.com';
  const userName = profile?.full_name || userEmail.split('@')[0];
  
  const visibleMenuItems = menuItems.filter(item => profile?.is_admin || !item.adminOnly);

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="justify-start w-full p-2 h-auto">
              <div className="flex justify-between items-center w-full">
                <div className="flex gap-2 items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{userName}</span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
               <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Ajustes</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
               <LogOut className="mr-2 h-4 w-4" />
               <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
