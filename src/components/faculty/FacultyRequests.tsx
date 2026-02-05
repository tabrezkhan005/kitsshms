"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Plus,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";

// Types for API data
interface FacultyRequest {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  expected_attendees: number;
  reason_for_booking: string;
  rejection_reason?: string;
  admin_notes?: string;
  booking_request_halls: Array<{
    halls: {
      name: string;
    };
  }>;
}

export default function FacultyRequests() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [requests, setRequests] = useState<FacultyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user from localStorage
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
  }, []);

  // Fetch requests
  React.useEffect(() => {
    if (!userId) return;

    const fetchRequests = async () => {
      try {
        const response = await fetch(`/api/booking-requests?requester_id=${userId}`);
        const data = await response.json();
        if (data.success) {
          setRequests(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userId]);

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

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  // Filter requests based on status
  const filteredRequests = selectedStatus === "all"
    ? requests
    : requests.filter(request => request.status === selectedStatus);

  // Calculate statistics
  const stats = {
    total: requests.length,
    approved: requests.filter(r => r.status === "approved").length,
    pending: requests.filter(r => r.status === "pending").length,
    rejected: requests.filter(r => r.status === "rejected").length
  };

  return (
    <div className="min-h-full bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Booking Requests</h1>
              <p className="text-gray-600">Track the status of your hall booking requests</p>
            </div>
            <div className="flex items-center gap-4">
              <Button size="sm" onClick={() => router.push("/faculty/book")}>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  Requests approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  Requests denied
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request History</CardTitle>
                  <CardDescription>
                    View and track all your booking requests
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Requests</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              ) : filteredRequests.length > 0 ? (
                <div className="space-y-6">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-gray-900">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(request.status)}
                            <div>
                              <CardTitle className="text-lg">{request.event_name}</CardTitle>
                              <CardDescription>
                                {request.booking_request_halls?.map(h => h.halls.name).join(", ")} • {new Date(request.start_date).toLocaleDateString()} • {request.start_time} - {request.end_time}
                              </CardDescription>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Event Details</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Purpose:</strong> {request.reason_for_booking}</p>
                              <p><strong>Attendees:</strong> {request.expected_attendees} people</p>
                              <p><strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Status Info</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Request ID:</strong> {request.id.slice(0, 8)}</p>
                              <p><strong>Status:</strong> <span className="capitalize">{request.status}</span></p>
                            </div>
                          </div>
                        </div>

                        {request.rejection_reason && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="font-semibold text-red-800">Rejection Reason:</span>
                            </div>
                            <p className="text-red-700 text-sm">{request.rejection_reason}</p>
                          </div>
                        )}

                        {request.admin_notes && (
                          <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                            <h4 className="font-semibold text-sm mb-1 text-gray-900">Admin Notes:</h4>
                            <p className="text-sm text-gray-700">{request.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No requests found for the selected filter</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
    </div>
  );
}
