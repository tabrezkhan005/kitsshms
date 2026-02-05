"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Plus,
  BarChart3,
  FileText,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { logoutUser } from "@/lib/auth";

// Navigation links for the sidebar
const sidebarLinks = [
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

// Types for API data
interface AnalyticsData {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  upcomingEvents: number;
}

interface FacultyRequest {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
  booking_request_halls: Array<{
    halls: {
      name: string;
    };
  }>;
}

export default function FacultyDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("analytics");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    upcomingEvents: 0
  });
  const [requests, setRequests] = useState<FacultyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Faculty user ID and name
  const [facultyUserId, setFacultyUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setFacultyUserId(parsedUser.id);
        setUserName(parsedUser.username || parsedUser.email || "Faculty");
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        // Handle error or redirect
      }
    }
  }, []);

  // Fetch analytics and requests data
  useEffect(() => {
    if (!facultyUserId) return;

    const fetchData = async () => {
      try {
        // Fetch faculty requests
        const requestsResponse = await fetch(`/api/booking-requests?requester_id=${facultyUserId}`);
        const requestsData = await requestsResponse.json();

        if (requestsData.success) {
          const fetchedRequests = requestsData.data || [];
          setRequests(fetchedRequests);

          // Calculate analytics from requests
          const analytics = {
            totalRequests: fetchedRequests.length || 0,
            approvedRequests: fetchedRequests.filter((r: FacultyRequest) => r.status === 'approved').length || 0,
            pendingRequests: fetchedRequests.filter((r: FacultyRequest) => r.status === 'pending').length || 0,
            rejectedRequests: fetchedRequests.filter((r: FacultyRequest) => r.status === 'rejected').length || 0,
            upcomingEvents: fetchedRequests.filter((r: FacultyRequest) =>
              r.status === 'approved' && new Date(r.start_date) >= new Date()
            ).length || 0
          };

          setAnalyticsData(analytics);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [facultyUserId]);

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to format time
  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="min-h-full bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
              <p className="text-gray-600">Welcome back, {userName}! Here&apos;s your overview</p>
            </div>
            <div className="flex items-center gap-4">
              <Button size="sm" onClick={() => router.push('/faculty/book')}>
                <Plus className="w-4 h-4 mr-2" />
                Book Hall
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="events">Today&apos;s Events</TabsTrigger>
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.totalRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      All time requests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{analyticsData.approvedRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Approved requests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{analyticsData.pendingRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting approval
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{analyticsData.rejectedRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      Rejected requests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{analyticsData.upcomingEvents}</div>
                    <p className="text-xs text-muted-foreground">
                      Future events
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Today's Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today&apos;s Events</CardTitle>
                  <CardDescription>
                    Your approved events scheduled for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading events...</p>
                    </div>
                  ) : requests.filter(r =>
                    r.status === 'approved' &&
                    new Date(r.start_date).toDateString() === new Date().toDateString()
                  ).length > 0 ? (
                    <div className="space-y-4">
                      {requests
                        .filter(r =>
                          r.status === 'approved' &&
                          new Date(r.start_date).toDateString() === new Date().toDateString()
                        )
                        .map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{request.event_name}</h3>
                                {getStatusBadge(request.status)}
                              </div>
                              <p className="text-sm text-gray-600">
                                <strong>Halls:</strong> {request.booking_request_halls.map(brh => brh.halls.name).join(', ')} |
                                <strong> Time:</strong> {formatTime(request.start_time)} - {formatTime(request.end_time)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Date:</strong> {formatDate(request.start_date)} to {formatDate(request.end_date)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No events scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="actions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => router.push('/faculty/book')}
                      className="h-20 flex flex-col items-center justify-center bg-gray-900 hover:bg-black text-white"
                    >
                      <Plus className="w-6 h-6 mb-2" />
                      <span>Book a Hall</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => router.push('/faculty/requests')}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      <span>View My Requests</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => router.push('/faculty/calendar')}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Calendar className="w-6 h-6 mb-2" />
                      <span>Check Calendar</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("analytics")}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <BarChart3 className="w-6 h-6 mb-2" />
                      <span>View Analytics</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
    </div>
  );
}
