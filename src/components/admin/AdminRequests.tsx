"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  Building2,
  FileText,
  BarChart3,
  Plus,
  LogOut,
  Inbox,
  RefreshCw,
  Eye,
  Mail,
  Home
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

// Types for booking requests
interface BookingRequest {
  id: string;
  event_name: string;
  event_description?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  expected_attendees: number;
  reason_for_booking: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string;
  users: {
    id: string;
    username: string;
    email: string;
    role: string;
    club_name?: string;
  };
  booking_request_halls: Array<{
    hall_id: string;
    halls: {
      id: string;
      name: string;
      capacity: number;
    };
  }>;
}

export default function AdminRequests() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

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

  // Fetch all booking requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/booking-requests');

      if (!response.ok) {
        console.error('Error fetching requests:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle request approval
  const handleApprove = async (requestId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/booking-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error approving request:', response.status, response.statusText);
        alert('Failed to approve request');
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert('Request approved successfully! Email notification sent.');
        fetchRequests();
      } else {
        alert(data.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle request rejection
  const handleReject = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/booking-requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });

      if (!response.ok) {
        console.error('Error rejecting request:', response.status, response.statusText);
        alert('Failed to reject request');
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert('Request rejected successfully! Email notification sent.');
        setRejectionReason("");
        fetchRequests();
      } else {
        alert(data.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-gray-900 text-white hover:bg-gray-800 gap-1.5">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700 gap-1.5">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-gray-400 text-gray-500 gap-1.5 line-through">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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

  // Format time
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
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
              <span className="font-bold text-lg text-gray-800 truncate">KITS Admin</span>
            </div>

            {/* Navigation Links */}
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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900">
                    <Inbox className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                      Booking Requests
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base">
                      Review and manage all booking requests
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={fetchRequests}
                  disabled={loading}
                  className="w-fit flex items-center gap-2 border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              variants={itemVariants}
            >
              <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-gray-900" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Total Requests</span>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-gray-400" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Pending</span>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-700">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-gray-700" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Approved</span>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.approved}</div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-gray-300" />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Rejected</span>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-400">{stats.rejected}</div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div className="mb-6" variants={itemVariants}>
              <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                {[
                  { key: 'all', label: 'All', count: stats.total },
                  { key: 'pending', label: 'Pending', count: stats.pending },
                  { key: 'approved', label: 'Approved', count: stats.approved },
                  { key: 'rejected', label: 'Rejected', count: stats.rejected },
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(tab.key as typeof filter)}
                    className={`rounded-lg px-4 transition-all duration-200 ${
                      filter === tab.key
                        ? 'bg-white text-gray-900 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      filter === tab.key ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Requests List */}
            {loading ? (
              <Card className="border border-gray-200 rounded-2xl">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    <span className="text-gray-500">Loading requests...</span>
                  </div>
                </CardContent>
              </Card>
            ) : filteredRequests.length === 0 ? (
              <Card className="border border-gray-200 rounded-2xl">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-500 max-w-sm">
                      {filter === 'all'
                        ? "There are no booking requests yet. They will appear here when faculty or clubs submit requests."
                        : `No ${filter} requests at the moment.`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <motion.div className="space-y-4" variants={containerVariants}>
                {filteredRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 group">
                      <div className={`h-1 ${
                        request.status === 'approved' ? 'bg-gray-900' :
                        request.status === 'pending' ? 'bg-gray-400' : 'bg-gray-200'
                      }`} />
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {request.event_name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {request.users.username}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="capitalize">{request.users.role}</span>
                                {request.users.club_name && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span>{request.users.club_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 md:flex-col md:items-end">
                            {getStatusBadge(request.status)}
                            <span className="text-xs text-gray-400">
                              {formatDate(request.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {formatDate(request.start_date)}
                              {request.start_date !== request.end_date && (
                                <span className="text-gray-400">- {formatDate(request.end_date)}</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Time</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {formatTime(request.start_time)} - {formatTime(request.end_time)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Attendees</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              {request.expected_attendees} people
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Hall</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              {request.booking_request_halls.map(h => h.halls.name).join(", ")}
                            </p>
                          </div>
                        </div>

                        {/* Purpose */}
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-1.5">Purpose</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{request.reason_for_booking}</p>
                        </div>

                        {/* Additional Requirements */}
                        {request.event_description && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1.5">Additional Requirements</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{request.event_description}</p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {request.rejection_reason && (
                          <div className="mb-4 p-4 bg-gray-100 border border-gray-200 rounded-xl">
                            <p className="text-xs font-medium text-gray-700 mb-1.5">Rejection Reason</p>
                            <p className="text-sm text-gray-600">{request.rejection_reason}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {request.status === 'pending' && (
                          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                            <Button
                              onClick={() => handleApprove(request.id)}
                              disabled={actionLoading}
                              className="bg-gray-900 hover:bg-black text-white rounded-xl"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Request
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  disabled={actionLoading}
                                  className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle>Reject Booking Request</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting this request. The requester will receive this reason via email.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <Label htmlFor="rejection-reason" className="text-sm font-medium">
                                      Rejection Reason <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                      id="rejection-reason"
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Enter the reason for rejection..."
                                      rows={4}
                                      className="mt-2 rounded-xl"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setRejectionReason("")}
                                    className="rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleReject(request.id, rejectionReason)}
                                    disabled={actionLoading || !rejectionReason.trim()}
                                    className="bg-gray-900 hover:bg-black rounded-xl"
                                  >
                                    {actionLoading ? 'Rejecting...' : 'Reject Request'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              className="text-gray-500 hover:text-gray-900 rounded-xl ml-auto"
                              onClick={() => window.open(`mailto:${request.users.email}`, '_blank')}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
