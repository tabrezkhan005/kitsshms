"use client";

import React, { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Plus,
  BarChart3,
  FileText,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";

// Navigation links for the sidebar
export const facultySidebarLinks = [
  {
    label: "Dashboard",
    href: "/faculty/dashboard",
    icon: <BarChart3 className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Book Halls",
    href: "/faculty/book",
    icon: <Plus className="w-5 h-5 text-gray-700" />
  },
  {
    label: "My Requests",
    href: "/faculty/requests",
    icon: <FileText className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Calendar",
    href: "/faculty/calendar",
    icon: <Calendar className="w-5 h-5 text-gray-700" />
  }
];

export function FacultySidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await logoutUser();
      if (response.success) {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        router.push('/login');
      } else {
        console.error('Logout failed:', response.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar>
        <SidebarBody>
          <div className="flex flex-col h-full">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 relative flex-shrink-0">
                <Image
                  src="/logo/kitslogo.png"
                  alt="KITS Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-bold text-lg text-gray-800 truncate">KITS Faculty</span>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1 flex-1">
              {facultySidebarLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={{
                    ...link,
                    icon: React.cloneElement(link.icon as React.ReactElement<{ className?: string }>, {
                      className: `w-5 h-5 ${pathname === link.href ? 'text-gray-900' : 'text-gray-500'}`
                    })
                  }}
                  className={`px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center ${
                    pathname === link.href
                      ? 'bg-gray-100 font-medium text-gray-900'
                      : 'hover:bg-gray-50'
                  }`}
                />
              ))}
            </nav>

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
