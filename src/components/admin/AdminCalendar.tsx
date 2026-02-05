"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle,
  Plus,
  BarChart3,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2
} from "lucide-react";
import { logoutUser } from "@/lib/auth";
import { motion } from "framer-motion";

// Navigation links
const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <BarChart3 className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Booking Requests",
    href: "/admin/requests",
    icon: <FileText className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Direct Bookings",
    href: "/admin/bookings",
    icon: <Plus className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Calendar",
    href: "/admin/calendar",
    icon: <CalendarIcon className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users className="w-5 h-5 text-gray-700" />
  },
  {
    label: "Hall History",
    href: "/admin/halls",
    icon: <Building2 className="w-5 h-5 text-gray-700" />
  }
];

// Types
interface HallAvailability {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'pending' | 'booked';
  booking?: {
    event_name: string;
    requester_name: string;
    requester_role: string;
    reason_for_booking: string;
    start_time: string;
    end_time: string;
    expected_attendees?: number;
  };
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function AdminCalendar() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<HallAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate calendar days
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push({
            date: d,
            day: d.getDate(),
            isCurrentMonth: d.getMonth() === month,
            isToday: d.toDateString() === today.toDateString(),
        });
    }
    return days;
  };

  const fetchHallAvailability = async (date: Date) => {
    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await fetch(`/api/halls/availability?date=${dateString}`, {
          cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.error('Error fetching hall availability:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

  const handleDateClick = async (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    setSelectedDate(day.date);
    setShowModal(true);
    const availability = await fetchHallAvailability(day.date);
    setSelectedDayData(availability);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await logoutUser();
      if (response.success) {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const days = generateCalendarDays(currentDate);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar>
        <SidebarBody>
          <div className="flex flex-col h-full">
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
              <span className="font-bold text-lg text-gray-800 truncate">KITS Admin</span>
            </div>

            <nav className="space-y-1 flex-1">
              {sidebarLinks.map((link) => (
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
                      ? 'bg-gray-100 font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                />
              ))}
            </nav>

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
        <motion.div
          className="p-6 md:p-8 max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Calendar</h1>
              <p className="text-gray-500 text-sm md:text-base mt-1">Manage hall availability and schedule</p>
            </div>
          </div>

          <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <h2 className="text-xl font-bold text-gray-900">
                     {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                   </h2>
                   <div className="flex gap-1">
                     <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8 rounded-lg border-gray-200">
                        <ChevronLeft className="w-4 h-4" />
                     </Button>
                     <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8 rounded-lg border-gray-200">
                        <ChevronRight className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>
                 <Button variant="outline" onClick={goToToday} className="rounded-xl border-gray-200">
                   Today
                 </Button>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500">
                      {day}
                    </div>
                  ))}
               </div>
               <div className="grid grid-cols-7 auto-rows-[120px]">
                  {days.map((day, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleDateClick(day)}
                      className={`
                        border-b border-r border-gray-100 p-3 relative transition-colors cursor-pointer group
                        ${!day.isCurrentMonth ? 'bg-gray-50/30 text-gray-300' : 'bg-white hover:bg-gray-50'}
                        ${day.isToday ? 'bg-blue-50/30' : ''}
                      `}
                    >
                      <span className={`
                        text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                        ${day.isToday ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700'}
                      `}>
                        {day.day}
                      </span>

                      {/* Simple Dot Indicators (Simulated for overview, since API call for every month day is heavy) */}
                      {/* In a real app we'd fetch monthly stats. Here we just show structure. */}
                      {day.isCurrentMonth && (
                         <div className="absolute bottom-3 left-3 right-3 flex gap-1 flex-wrap">
                            {/* Visual placeholder for events */}
                         </div>
                      )}
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-0 gap-0 border-gray-200">
           <div className="bg-gray-900 p-6 flex items-center justify-between text-white">
             <div>
                <DialogTitle className="text-xl font-bold">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </DialogTitle>
                <DialogDescription className="text-gray-400 mt-1">
                  Hall availability status
                </DialogDescription>
             </div>
             <CalendarIcon className="w-8 h-8 opacity-20" />
           </div>

           <div className="p-6 bg-white min-h-[300px]">
             {loading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                  <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Retrieving schedule...</p>
                </div>
             ) : selectedDayData.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayData.map(hall => (
                    <div key={hall.id} className={`p-4 rounded-xl border ${
                      hall.status === 'booked' ? 'border-red-100 bg-red-50/30' :
                      hall.status === 'pending' ? 'border-yellow-100 bg-yellow-50/30' :
                      'border-gray-100 bg-white'
                    }`}>
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2">
                           <span className="font-bold text-gray-900">{hall.name}</span>
                           <Badge variant="outline" className={`
                             shadow-none border-0 px-2 py-0.5
                             ${hall.status === 'booked' ? 'bg-red-100 text-red-700' :
                               hall.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                               'bg-green-100 text-green-700'}
                           `}>
                             {hall.status.charAt(0).toUpperCase() + hall.status.slice(1)}
                           </Badge>
                         </div>
                         <span className="text-xs text-gray-500">Cap: {hall.capacity}</span>
                       </div>

                       {hall.booking ? (
                         <div className="space-y-3 pl-3 border-l-2 border-gray-200">
                            <div>
                               <p className="text-sm font-semibold text-gray-900">{hall.booking.event_name}</p>
                               <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                 <Clock className="w-3 h-3" />
                                 {hall.booking.start_time} - {hall.booking.end_time}
                               </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100 w-fit">
                               <Users className="w-3 h-3" />
                               <span className="font-medium">{hall.booking.requester_name}</span>
                               <span className="text-gray-400">•</span>
                               <span className="capitalize">{hall.booking.requester_role}</span>
                            </div>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-sm text-green-600 pl-3 border-l-2 border-green-200">
                           <CheckCircle className="w-4 h-4" />
                           Available for booking
                         </div>
                       )}
                    </div>
                  ))}
                </div>
             ) : (
               <div className="text-center py-12">
                 <p className="text-gray-500">No hall data available.</p>
               </div>
             )}
           </div>

           <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <Button onClick={() => setShowModal(false)} className="w-full bg-white border-gray-200 text-gray-900 hover:bg-gray-100 shadow-sm border">
                Close
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
