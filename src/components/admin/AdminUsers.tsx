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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  Plus,
  BarChart3,
  FileText,
  LogOut,
  Search,
  Mail,
  User,
  RefreshCw,
  AlertCircle,
  Building2,
  GraduationCap,
  Briefcase,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ArrowUpDown,
  History,
  TrendingUp
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
  }
];

interface UserBooking {
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
  booking_request_halls?: Array<{
    halls: {
      id: string;
      name: string;
    };
  }>;
}

interface UserWithDetails {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'faculty' | 'clubs';
  branch?: string;
  club_name?: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  bookings?: UserBooking[];
  stats?: {
    totalBookings: number;
    approved: number;
    pending: number;
    rejected: number;
    upcomingEvents: number;
  };
}

export default function AdminUsers() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState("");

  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "faculty",
    branch: "",
    club_name: ""
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");

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

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterRole !== 'all') params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/users?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users || []);
        } else {
          setError(data.message || "Failed to fetch users");
        }
      } else {
        setError(`Failed to fetch users (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError("An unexpected error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch user details
  const fetchUserDetails = async (userId: string) => {
    setUserDetailsLoading(true);
    try {
      const response = await fetch(`/api/users?id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedUser(data.user);
        setShowUserDetails(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  // Add new user
  const handleAddUser = async () => {
    setAddUserLoading(true);
    setAddUserError("");

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddUser(false);
        setNewUser({ username: "", email: "", password: "", role: "faculty", branch: "", club_name: "" });
        fetchUsers();
      } else {
        setAddUserError(data.message || "Failed to add user");
      }
    } catch (error) {
      setAddUserError("An unexpected error occurred");
    } finally {
      setAddUserLoading(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, is_active: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    switch (sortBy) {
      case 'username':
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
        break;
      case 'email':
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
        break;
      case 'role':
        aVal = a.role;
        bVal = b.role;
        break;
      case 'created_at':
      default:
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-none font-medium">Admin</Badge>;
      case "faculty":
        return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none font-medium">Faculty</Badge>;
      case "clubs":
        return <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 shadow-none font-medium">Club</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean, isEmailVerified: boolean) => {
    if (!isActive) {
      return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Inactive</Badge>;
    }
    if (!isEmailVerified) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Unverified</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Users className="w-5 h-5 text-gray-500" />;
      case "faculty": return <GraduationCap className="w-5 h-5 text-gray-500" />;
      case "clubs": return <Briefcase className="w-5 h-5 text-gray-500" />;
      default: return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                      Users Management
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base mt-0.5">
                      Add, view, and manage all system users
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={loading}
                    className="hidden md:flex items-center gap-2 border-gray-200 hover:bg-gray-50 rounded-xl"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  {/* Add User Dialog */}
                  <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                    <DialogTrigger asChild>
                      <Button className="bg-gray-900 hover:bg-black text-white rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account with role assignment
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username *</Label>
                          <Input
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            placeholder="Enter username"
                            className="rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="Enter email address"
                            className="rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            placeholder="Enter password"
                            className="rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="role">Role *</Label>
                          <Select
                            value={newUser.role}
                            onValueChange={(value) => setNewUser({...newUser, role: value})}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                              <SelectItem value="clubs">Club</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {newUser.role === 'faculty' && (
                          <div className="space-y-2">
                            <Label htmlFor="branch">Branch/Department</Label>
                            <Input
                              id="branch"
                              value={newUser.branch}
                              onChange={(e) => setNewUser({...newUser, branch: e.target.value})}
                              placeholder="e.g., Computer Science"
                              className="rounded-xl"
                            />
                          </div>
                        )}

                        {newUser.role === 'clubs' && (
                          <div className="space-y-2">
                            <Label htmlFor="club_name">Club Name</Label>
                            <Input
                              id="club_name"
                              value={newUser.club_name}
                              onChange={(e) => setNewUser({...newUser, club_name: e.target.value})}
                              placeholder="e.g., Coding Club"
                              className="rounded-xl"
                            />
                          </div>
                        )}

                        {addUserError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {addUserError}
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddUser(false)} className="rounded-xl">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddUser}
                          disabled={addUserLoading || !newUser.username || !newUser.email || !newUser.password}
                          className="bg-gray-900 hover:bg-black rounded-xl"
                        >
                          {addUserLoading ? 'Creating...' : 'Create User'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <div className="h-1 bg-gray-900" />

                <CardHeader className="pb-4 pt-6 px-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">All Users</CardTitle>
                      <CardDescription className="text-gray-500">
                        Manage users, roles, and account status
                      </CardDescription>
                    </div>

                    {/* Search, Filter and Sort */}
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-10 border-gray-200 bg-gray-50 focus:bg-white rounded-xl"
                        />
                      </div>
                      <Select
                        value={filterRole}
                        onValueChange={setFilterRole}
                      >
                        <SelectTrigger className="w-full md:w-[130px] h-10 border-gray-200 bg-gray-50 focus:bg-white rounded-xl">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="clubs">Clubs</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={sortBy}
                        onValueChange={setSortBy}
                      >
                        <SelectTrigger className="w-full md:w-[130px] h-10 border-gray-200 bg-gray-50 focus:bg-white rounded-xl">
                          <ArrowUpDown className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="created_at">Date Joined</SelectItem>
                          <SelectItem value="username">Name</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="role">Role</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {error && (
                    <div className="p-6">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                        <Button
                          variant="link"
                          className="ml-auto text-red-700 h-auto p-0 underline"
                          onClick={() => fetchUsers()}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3" />
                      <p className="text-gray-500 text-sm">Loading users...</p>
                    </div>
                  ) : sortedUsers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {sortedUsers.map((user) => (
                        <div key={user.id} className="p-4 hover:bg-gray-50/80 transition-colors duration-200">
                          <div className="flex items-start md:items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200 text-gray-400">
                              {getRoleIcon(user.role)}
                            </div>

                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              {/* User Info */}
                              <div className="md:col-span-4">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">{user.username}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                              </div>

                              {/* Role & Org */}
                              <div className="md:col-span-3">
                                <div className="flex items-center gap-2">
                                  {getRoleBadge(user.role)}
                                </div>
                                {(user.club_name || user.branch) && (
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    {user.club_name ? `Club: ${user.club_name}` : user.branch}
                                  </p>
                                )}
                              </div>

                              {/* Status */}
                              <div className="md:col-span-2">
                                {getStatusBadge(user.is_active, user.is_email_verified)}
                              </div>

                              {/* Date */}
                              <div className="md:col-span-2">
                                <p className="text-xs text-gray-400">Joined</p>
                                <p className="text-xs font-medium text-gray-700">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="md:col-span-1 flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => fetchUserDetails(user.id)}
                                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-gray-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                                  className={`h-8 w-8 p-0 rounded-lg ${user.is_active ? 'hover:bg-red-50' : 'hover:bg-green-50'}`}
                                  title={user.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {user.is_active ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        {searchTerm || filterRole !== "all"
                          ? "Try adjusting your search or filters to find what you're looking for."
                          : "There are no users in the system yet."
                        }
                      </p>
                    </div>
                  )}

                  {/* Footer Summary */}
                  {!loading && (
                    <div className="bg-gray-50 border-t border-gray-100 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Total Users</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.role === 'admin').length}
                          </p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Admins</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.role === 'faculty').length}
                          </p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Faculty</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.role === 'clubs').length}
                          </p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Clubs</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                {selectedUser && getRoleIcon(selectedUser.role)}
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedUser?.username}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {selectedUser?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {userDetailsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : selectedUser && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100">
                <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="bookings" className="rounded-lg">Bookings</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* User Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border rounded-xl">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedUser.stats?.totalBookings || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Bookings</p>
                    </CardContent>
                  </Card>
                  <Card className="border rounded-xl">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedUser.stats?.approved || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Approved</p>
                    </CardContent>
                  </Card>
                  <Card className="border rounded-xl">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{selectedUser.stats?.pending || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Pending</p>
                    </CardContent>
                  </Card>
                  <Card className="border rounded-xl">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{selectedUser.stats?.rejected || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Rejected</p>
                    </CardContent>
                  </Card>
                </div>

                {/* User Details */}
                <Card className="border rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Role</span>
                      <span className="font-medium">{getRoleBadge(selectedUser.role)}</span>
                    </div>
                    {selectedUser.branch && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Branch</span>
                        <span className="font-medium">{selectedUser.branch}</span>
                      </div>
                    )}
                    {selectedUser.club_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Club</span>
                        <span className="font-medium">{selectedUser.club_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      {getStatusBadge(selectedUser.is_active, selectedUser.is_email_verified)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Joined</span>
                      <span className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings" className="mt-4">
                <Card className="border rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Recent Bookings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedUser.bookings && selectedUser.bookings.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {selectedUser.bookings.slice(0, 10).map((booking) => (
                          <div key={booking.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{booking.event_name}</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(booking.start_date).toLocaleDateString()} • {booking.start_time} - {booking.end_time}
                                </p>
                                {booking.booking_request_halls && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    <Building2 className="w-3 h-3 inline mr-1" />
                                    {booking.booking_request_halls.map(h => h.halls.name).join(', ')}
                                  </p>
                                )}
                              </div>
                              {getBookingStatusBadge(booking.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No bookings yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card className="border rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Complete History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedUser.bookings && selectedUser.bookings.length > 0 ? (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {selectedUser.bookings.map((booking) => (
                          <div key={booking.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${
                              booking.status === 'approved' ? 'bg-green-500' :
                              booking.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{booking.event_name}</p>
                              <p className="text-xs text-gray-400">{new Date(booking.created_at).toLocaleString()}</p>
                            </div>
                            <span className="text-xs text-gray-500 capitalize">{booking.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No history available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
