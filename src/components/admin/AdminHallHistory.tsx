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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Calendar,
  Users,
  Plus,
  BarChart3,
  FileText,
  LogOut,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  History,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { logoutUser } from "@/lib/auth";
import { motion } from "framer-motion";

// Navigation links for the sidebar
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
    icon: <Calendar className="w-5 h-5 text-gray-700" />
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

interface HallStats {
  totalBookings: number;
  approved: number;
  pending: number;
  rejected?: number;
  totalAttendees?: number;
  upcomingEvents?: number;
  facultyBookings?: number;
  clubBookings?: number;
}

interface HallBooking {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: string;
  expected_attendees: number;
  reason_for_booking: string;
  created_at: string;
  users?: {
    id: string;
    username: string;
    email: string;
    role: string;
    club_name?: string;
  };
}

interface Hall {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  stats: HallStats;
  bookings?: HallBooking[];
  monthlyUsage?: Array<{ month: string; count: number }>;
}

// Chart config for status breakdown
const statusChartConfig: ChartConfig = {
  approved: {
    label: "Approved",
    color: "#18181b"
  },
  pending: {
    label: "Pending",
    color: "#71717a"
  },
  rejected: {
    label: "Rejected",
    color: "#d4d4d8"
  }
};

// Chart config for monthly usage
const monthlyChartConfig: ChartConfig = {
  count: {
    label: "Bookings",
    color: "#18181b"
  }
};

export default function AdminHallHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [showHallDetails, setShowHallDetails] = useState(false);
  const [hallDetailsLoading, setHallDetailsLoading] = useState(false);

  // Handle logout
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

  // Fetch halls
  const fetchHalls = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch('/api/halls/history', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHalls(data.halls || []);
        } else {
          setError(data.message || "Failed to fetch halls");
        }
      } else {
        setError(`Failed to fetch halls (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching halls:', error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  // Fetch hall details
  const fetchHallDetails = async (hallId: string) => {
    setHallDetailsLoading(true);
    try {
      const response = await fetch(`/api/halls/history?hall_id=${hallId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedHall(data.hall);
        setShowHallDetails(true);
      }
    } catch (error) {
      console.error('Error fetching hall details:', error);
    } finally {
      setHallDetailsLoading(false);
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-zinc-900 text-white hover:bg-zinc-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-zinc-200 text-zinc-800 hover:bg-zinc-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-zinc-300 text-zinc-500"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Prepare chart data for a hall
  const getStatusChartData = (hall: Hall) => [
    { name: "Approved", value: hall.stats.approved, fill: "#18181b" },
    { name: "Pending", value: hall.stats.pending, fill: "#71717a" },
    { name: "Rejected", value: hall.stats.rejected || 0, fill: "#e4e4e7" }
  ].filter(d => d.value > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Calculate totals
  const totalBookings = halls.reduce((sum, h) => sum + h.stats.totalBookings, 0);
  const totalApproved = halls.reduce((sum, h) => sum + h.stats.approved, 0);
  const totalPending = halls.reduce((sum, h) => sum + h.stats.pending, 0);

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
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
              <span className="font-bold text-lg text-zinc-900 truncate">KITS Admin</span>
            </div>

            <nav className="space-y-1 flex-1">
              {sidebarLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={{
                    ...link,
                    icon: React.cloneElement(link.icon as React.ReactElement, {
                      className: `w-5 h-5 ${pathname === link.href ? 'text-zinc-900' : 'text-zinc-400'}`
                    })
                  }}
                  className={`px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center ${
                    pathname === link.href
                      ? 'bg-zinc-100 font-medium text-zinc-900'
                      : 'hover:bg-zinc-50 text-zinc-600'
                  }`}
                />
              ))}
            </nav>

            <div className="pt-4 border-t border-zinc-100">
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="w-full justify-start text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <motion.div
          className="p-6 md:p-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div className="mb-8" variants={itemVariants}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 shadow-lg shadow-zinc-900/20">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
                      Hall Analytics
                    </h1>
                    <p className="text-zinc-500 text-sm md:text-base mt-0.5">
                      Comprehensive usage statistics and booking history
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHalls}
                  disabled={loading}
                  className="flex items-center gap-2 border-zinc-200 hover:bg-zinc-100 rounded-xl text-zinc-700"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </motion.div>

            {/* Summary Stats */}
            {!loading && halls.length > 0 && (
              <motion.div variants={itemVariants} className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Bookings</p>
                          <p className="text-3xl font-bold text-zinc-900 mt-1">{totalBookings}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
                          <Activity className="w-6 h-6 text-zinc-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Approved</p>
                          <p className="text-3xl font-bold text-zinc-900 mt-1">{totalApproved}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pending</p>
                          <p className="text-3xl font-bold text-zinc-900 mt-1">{totalPending}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-zinc-200 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-zinc-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Halls</p>
                          <p className="text-3xl font-bold text-zinc-900 mt-1">{halls.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-zinc-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div variants={itemVariants} className="mb-6">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Halls Grid with Charts */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 text-sm">Loading hall data...</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
              >
                {halls.map((hall) => (
                  <motion.div key={hall.id} variants={itemVariants}>
                    <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                      <CardHeader className="pb-0 pt-5 px-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl font-semibold text-zinc-900">{hall.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1 text-zinc-500">
                              <Users className="w-3.5 h-3.5" />
                              Capacity: {hall.capacity} seats
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchHallDetails(hall.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-9 px-3 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Mini Bar Chart */}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Booking Status</p>
                            <ChartContainer config={statusChartConfig} className="h-[120px] w-full">
                              <BarChart
                                data={[
                                  { status: "Approved", count: hall.stats.approved },
                                  { status: "Pending", count: hall.stats.pending },
                                  { status: "Rejected", count: hall.stats.rejected || 0 }
                                ]}
                                layout="vertical"
                                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                              >
                                <XAxis type="number" hide />
                                <YAxis
                                  type="category"
                                  dataKey="status"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 11, fill: '#71717a' }}
                                  width={70}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar
                                  dataKey="count"
                                  radius={[0, 6, 6, 0]}
                                  fill="#18181b"
                                />
                              </BarChart>
                            </ChartContainer>
                          </div>

                          {/* Stats Summary */}
                          <div className="w-28 flex flex-col justify-center">
                            <div className="text-center p-3 bg-zinc-50 rounded-xl mb-2">
                              <p className="text-2xl font-bold text-zinc-900">{hall.stats.totalBookings}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">Total</p>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1 text-center p-2 bg-zinc-900 rounded-lg">
                                <p className="text-sm font-bold text-white">{hall.stats.approved}</p>
                              </div>
                              <div className="flex-1 text-center p-2 bg-zinc-200 rounded-lg">
                                <p className="text-sm font-bold text-zinc-700">{hall.stats.pending}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* View Full History Link */}
                        <button
                          onClick={() => fetchHallDetails(hall.id)}
                          className="w-full mt-4 pt-4 border-t border-zinc-100 flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group/link"
                        >
                          <History className="w-4 h-4" />
                          View Full History
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Hall Details Dialog */}
      <Dialog open={showHallDetails} onOpenChange={setShowHallDetails}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl p-0 gap-0 border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-zinc-900 px-8 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{selectedHall?.name}</DialogTitle>
                <DialogDescription className="text-zinc-400 mt-1">
                  Capacity: {selectedHall?.capacity} seats • Full Analytics View
                </DialogDescription>
              </div>
            </div>
          </div>

          {hallDetailsLoading ? (
            <div className="flex justify-center py-16 bg-white">
              <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : selectedHall && (
            <div className="bg-white max-h-[calc(90vh-120px)] overflow-y-auto">
              <Tabs defaultValue="overview" className="w-full">
                <div className="px-8 pt-6 bg-zinc-50 border-b border-zinc-100">
                  <TabsList className="grid w-full grid-cols-3 rounded-xl bg-zinc-200/50 p-1">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                    <TabsTrigger value="bookings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Bookings</TabsTrigger>
                    <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Trends</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="p-8 space-y-6 mt-0">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-zinc-900">{selectedHall.stats?.totalBookings || 0}</p>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">Total Bookings</p>
                    </div>
                    <div className="p-4 bg-zinc-900 rounded-xl text-center">
                      <p className="text-3xl font-bold text-white">{selectedHall.stats?.approved || 0}</p>
                      <p className="text-xs text-zinc-400 mt-1 font-medium">Approved</p>
                    </div>
                    <div className="p-4 bg-zinc-200 rounded-xl text-center">
                      <p className="text-3xl font-bold text-zinc-700">{selectedHall.stats?.pending || 0}</p>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">Pending</p>
                    </div>
                    <div className="p-4 bg-zinc-100 rounded-xl text-center">
                      <p className="text-3xl font-bold text-zinc-900">{selectedHall.stats?.upcomingEvents || 0}</p>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">Upcoming</p>
                    </div>
                  </div>

                  {/* Pie Chart & Stats */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <Card className="border border-zinc-100 rounded-2xl shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={statusChartConfig} className="h-[200px] w-full">
                          <PieChart>
                            <Pie
                              data={getStatusChartData(selectedHall)}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={50}
                              strokeWidth={2}
                              stroke="#fff"
                            >
                              {getStatusChartData(selectedHall).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                        <div className="flex justify-center gap-6 mt-2">
                          {getStatusChartData(selectedHall).map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className="text-xs text-zinc-600">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Usage Breakdown */}
                    <Card className="border border-zinc-100 rounded-2xl shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Usage Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                          <span className="text-zinc-600 text-sm">Faculty Bookings</span>
                          <span className="font-semibold text-zinc-900">{selectedHall.stats?.facultyBookings || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                          <span className="text-zinc-600 text-sm">Club Bookings</span>
                          <span className="font-semibold text-zinc-900">{selectedHall.stats?.clubBookings || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                          <span className="text-zinc-600 text-sm">Total Attendees</span>
                          <span className="font-semibold text-zinc-900">{selectedHall.stats?.totalAttendees || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-zinc-600 text-sm">Rejection Rate</span>
                          <span className="font-semibold text-red-600">
                            {selectedHall.stats?.totalBookings
                              ? Math.round(((selectedHall.stats?.rejected || 0) / selectedHall.stats.totalBookings) * 100)
                              : 0}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="bookings" className="p-8 mt-0">
                  <Card className="border border-zinc-100 rounded-2xl shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Recent Bookings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedHall.bookings && selectedHall.bookings.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {selectedHall.bookings.slice(0, 20).map((booking) => (
                            <div key={booking.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-zinc-900">{booking.event_name}</h4>
                                  <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(booking.start_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                    <span className="text-zinc-300">•</span>
                                    <Clock className="w-3.5 h-3.5" />
                                    {booking.start_time} - {booking.end_time}
                                  </p>
                                  {booking.users && (
                                    <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                                      <Users className="w-3 h-3" />
                                      {booking.users.club_name || booking.users.username}
                                      <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4 border-zinc-200">
                                        {booking.users.role}
                                      </Badge>
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0 ml-4">
                                  {getBookingStatusBadge(booking.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-zinc-400">
                          <Calendar className="w-10 h-10 mx-auto mb-3 text-zinc-200" />
                          <p className="font-medium">No bookings yet</p>
                          <p className="text-sm mt-1">Bookings will appear here once made</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trends" className="p-8 mt-0">
                  <Card className="border border-zinc-100 rounded-2xl shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Monthly Usage (Last 6 Months)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedHall.monthlyUsage && selectedHall.monthlyUsage.length > 0 ? (
                        <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
                          <BarChart
                            data={selectedHall.monthlyUsage}
                            margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#71717a' }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#71717a' }}
                              width={30}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                              dataKey="count"
                              fill="#18181b"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={50}
                            />
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-center py-12 text-zinc-400">
                          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-zinc-200" />
                          <p className="font-medium">No trend data available</p>
                          <p className="text-sm mt-1">Data will populate as bookings are made</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
