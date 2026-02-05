"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  DesktopSidebar,
  MobileSidebar
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Users2, XCircle, CheckCircle, Clock, AlertCircle, BarChart3, Plus, Calendar, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
  },
  {
    label: "Club Profile",
    href: "/club/profile",
    icon: <Users2 className="w-5 h-5 text-gray-700" />
  }
];

// Types for club requests
interface ClubRequest {
  id: string;
  event_name: string;
  event_description: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  expected_attendees: number;
  reason_for_booking: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  denial_reason: string | null;
  created_at: string;
  updated_at: string;
  booking_request_halls: Array<{
    hall_id: string;
    halls: {
      id: string;
      name: string;
      capacity: number;
    };
  }>;
}

export default function ClubRequests() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [requests, setRequests] = useState<ClubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch club requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Use the club user ID from the database
      const clubUserId = "a3072456-c8c8-4f81-8bdb-b584119d533f";
      const response = await fetch(`/api/booking-requests?requester_id=${clubUserId}`);

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        console.error('Error fetching requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete request
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    setDeleting(requestId);
    try {
      const clubUserId = "a3072456-c8c8-4f81-8bdb-b584119d533f";
      const response = await fetch(`/api/booking-requests?id=${requestId}&requester_id=${clubUserId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the deleted request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        console.error('Error deleting request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    } finally {
      setDeleting(null);
    }
  };

  // Load requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter requests based on selected status
  const filteredRequests = selectedStatus === "all"
    ? requests
    : requests.filter(request => request.status === selectedStatus);

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
          </DesktopSidebar>

          <MobileSidebar>
            {/* Mobile Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo/kitslogo.png"
                  alt="KITS Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-bold text-lg text-gray-800">KITS Clubs</span>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="space-y-2">
              {sidebarLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={link}
                  className="px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                />
              ))}
            </nav>
          </MobileSidebar>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
              <p className="text-gray-600">Track your club&apos;s booking requests</p>
            </div>
            <div className="flex items-center gap-4">
              <Button size="sm" onClick={() => router.push("/club/book")}>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="space-y-6">
            {/* Filter Section */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Requests</CardTitle>
                <CardDescription>
                  Filter your requests by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("all")}
                  >
                    All ({requests.length})
                  </Button>
                  <Button
                    variant={selectedStatus === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("pending")}
                  >
                    Pending ({requests.filter(r => r.status === "pending").length})
                  </Button>
                  <Button
                    variant={selectedStatus === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("approved")}
                  >
                    Approved ({requests.filter(r => r.status === "approved").length})
                  </Button>
                  <Button
                    variant={selectedStatus === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("rejected")}
                  >
                    Rejected ({requests.filter(r => r.status === "rejected").length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Requests List */}
            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading requests...</p>
                  </CardContent>
                </Card>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(request.status)}
                          <div>
                            <CardTitle className="text-lg">{request.event_name}</CardTitle>
                            <CardDescription>
                              {request.booking_request_halls?.map(h => h.halls.name).join(", ") || "No halls specified"} • {formatDate(request.start_date)} • {request.start_time} - {request.end_time}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          {request.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRequest(request.id)}
                              disabled={deleting === request.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Event Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Purpose:</strong> {request.reason_for_booking}</p>
                            <p><strong>Attendees:</strong> {request.expected_attendees} people</p>
                            <p><strong>Request Date:</strong> {formatDate(request.created_at)}</p>
                            <p><strong>Halls:</strong> {request.booking_request_halls?.map(h => h.halls.name).join(", ") || "No halls specified"}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Event Information</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Start Date:</strong> {formatDate(request.start_date)}</p>
                            <p><strong>End Date:</strong> {formatDate(request.end_date)}</p>
                            <p><strong>Time:</strong> {request.start_time} - {request.end_time}</p>
                            <p><strong>Description:</strong> {request.event_description || "No description provided"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Denial Reason */}
                      {request.denial_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-red-800">Denial Reason:</span>
                          </div>
                          <p className="text-red-700 text-sm">{request.denial_reason}</p>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {request.admin_notes && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-800">Admin Notes:</span>
                          </div>
                          <p className="text-blue-700 text-sm">{request.admin_notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {request.status === "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/club/book")}
                          >
                            Resubmit Request
                          </Button>
                        )}
                        {request.status === "approved" && (
                          <Button variant="outline" size="sm">
                            Download Approval
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No requests found for the selected filter</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/club/book")}
                    >
                      Create New Request
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
