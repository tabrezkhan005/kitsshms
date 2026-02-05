"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  DesktopSidebar,
  MobileSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, FileText, Calendar, LogOut } from "lucide-react";
import { logoutUser } from "@/lib/auth";
import HallCalendar from "@/components/ui/HallCalendar";

// Navigation links for the club sidebar
const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/club/dashboard",
    icon: <BarChart3 className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Book Halls",
    href: "/club/book",
    icon: <Plus className="w-5 h-5 text-gray-700" />
  },
  {
    label: "My Requests",
    href: "/club/requests",
    icon: <FileText className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Calendar",
    href: "/club/calendar",
    icon: <Calendar className="w-5 h-5 text-gray-700" />
  }
];

export default function ClubCalendarPage() {
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await logoutUser();
      if (response.success) {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login';
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
      {/* Sidebar */}
      <Sidebar>
        <SidebarBody>
          <DesktopSidebar>
            {/* Logo and Title */}
            <div className="flex items-center gap-3 mb-8 min-w-0">
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
              <span className="font-bold text-lg text-gray-800 truncate">KITS Clubs</span>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-2 flex-1">
              {sidebarLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={link}
                  className="px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center min-w-0"
                />
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-auto pt-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </DesktopSidebar>

          <MobileSidebar>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 relative">
                <Image
                  src="/logo/kitslogo.png"
                  alt="KITS Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-bold text-base text-gray-800">KITS Clubs</span>
            </div>

            <nav className="space-y-2">
              {sidebarLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={link}
                  className="px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                />
              ))}
            </nav>

            {/* Mobile Logout Button */}
            <div className="mt-auto pt-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </MobileSidebar>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hall Calendar</h1>
              <p className="text-gray-600">View hall availability and plan your events</p>
            </div>
          </div>
        </header>

        {/* Calendar Content */}
        <main className="p-6">
          {/* Use the HallCalendar component */}
          <HallCalendar className="w-full" compact={false} />
        </main>
      </div>
    </div>
  );
}
