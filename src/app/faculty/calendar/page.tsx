"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, FileText, Calendar, LogOut } from "lucide-react";
import { logoutUser } from "@/lib/auth";
import HallCalendar from "@/components/ui/HallCalendar";

export default function FacultyCalendarPage() {
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
    <div className="h-full flex flex-col bg-gray-50">
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
  );
}
