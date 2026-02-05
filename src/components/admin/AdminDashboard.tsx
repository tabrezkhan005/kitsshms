"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle,
  Plus,
  BarChart3,
  FileText,
  LogOut,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2
} from "lucide-react";
import { logoutUser } from "@/lib/auth";
import { motion } from "framer-motion";

// Types for API data
interface AnalyticsData {
  stats: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    totalHalls: number;
  };
  todayEvents: Array<{
    id: string;
    event_name: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    status: string;
    users: {
      username: string;
      role: string;
      club_name?: string;
    };
    booking_request_halls: Array<{
      halls: {
        name: string;
      };
    }>;
  }>;
  recentRequests: Array<{
    id: string;
    event_name: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
    users: {
      username: string;
      role: string;
      club_name?: string;
    };
    booking_request_halls: Array<{
      halls: {
        name: string;
      };
    }>;
  }>;
}

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

const defaultAnalyticsData: AnalyticsData = {
  stats: {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalHalls: 0,
  },
  todayEvents: [],
  recentRequests: []
};

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(defaultAnalyticsData);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch('/api/admin/analytics?period=today', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <Badge className="bg-green-50 text-green-700 border-green-200 shadow-none">Approved</Badge>;
    if (s === 'pending') return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 shadow-none">Pending</Badge>;
    if (s === 'rejected') return <Badge className="bg-red-50 text-red-700 border-red-200 shadow-none">Rejected</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

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
                    icon: React.cloneElement(link.icon as React.ReactElement, {
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
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" variants={itemVariants}>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-gray-500 text-sm md:text-base mt-1">
                Overview of latest bookings and system activity
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => fetchAnalytics()}
                disabled={loading}
                className="rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/admin/bookings/new')}
                className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl shadow-lg shadow-gray-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>
          </motion.div>

          {error && (
            <motion.div variants={itemVariants} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Requests Today"
              value={analyticsData.stats.totalRequests}
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              change="Total submitted"
            />
            <StatsCard
              title="Pending"
              value={analyticsData.stats.pendingRequests}
              icon={<Clock className="w-5 h-5 text-yellow-600" />}
              change="Requires action"
              highlight={analyticsData.stats.pendingRequests > 0}
            />
            <StatsCard
              title="Approved Today"
              value={analyticsData.stats.approvedRequests}
              icon={<CheckCircle className="w-5 h-5 text-green-600" />}
              change="Events scheduled"
            />
            <StatsCard
              title="Available Halls"
              value={analyticsData.stats.totalHalls}
              icon={<BarChart3 className="w-5 h-5 text-gray-600" />}
              change="Total capacity"
            />
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Events (2 cols) */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Today's Events</h2>
                <Button variant="link" onClick={() => router.push('/admin/calendar')} className="text-gray-500 hover:text-gray-900">
                  View Calendar <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden min-h-[400px]">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : analyticsData.todayEvents.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {analyticsData.todayEvents.map((event) => (
                        <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-900 font-medium border border-gray-200 flex-shrink-0">
                                <span className="text-xs uppercase text-gray-500">{event.start_time.split(':')[0]}</span>
                                <span className="text-sm font-bold">{event.start_time.slice(-2) || '00'}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{event.event_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  <span>{event.booking_request_halls.map(h => h.halls.name).join(', ')}</span>
                                  <span>•</span>
                                  <span>{event.start_time} - {event.end_time}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                  <Users className="w-3 h-3" />
                                  <span>{event.users.club_name || event.users.username}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                               {getStatusBadge(event.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<CalendarIcon className="w-12 h-12 text-gray-300" />}
                      title="No events today"
                      description="There are no approved events scheduled for today."
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Requests (1 col) */}
            <motion.div variants={itemVariants} className="space-y-4">
               <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
                <Button variant="link" onClick={() => router.push('/admin/requests')} className="text-gray-500 hover:text-gray-900">
                  View All
                </Button>
              </div>

               <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden min-h-[400px]">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : analyticsData.recentRequests.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {analyticsData.recentRequests.map((req) => (
                        <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => router.push('/admin/requests')}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(req.created_at).toLocaleDateString()}
                            </span>
                            {getStatusBadge(req.status)}
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {req.event_name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                             {req.booking_request_halls.map(h => h.halls.name).join(', ')}
                          </p>
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                              {req.users.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-500 truncate">{req.users.club_name || req.users.username}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<FileText className="w-12 h-12 text-gray-300" />}
                      title="No recent requests"
                      description="New booking requests will appear here."
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, change, highlight = false }: { title: string, value: number, icon: React.ReactNode, change: string, highlight?: boolean }) {
  return (
    <Card className={`border shadow-sm rounded-2xl transition-all duration-200 ${highlight ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">{title}</span>
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
            {icon}
          </div>
        </div>
        <div>
          <span className="text-2xl font-bold text-gray-900 block">{value}</span>
          <span className="text-xs text-gray-500 mt-1 block">{change}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 p-4 bg-gray-50 rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
    </div>
  );
}
