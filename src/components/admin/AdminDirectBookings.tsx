"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Calendar,
  Users,
  Clock,
  Plus,
  BarChart3,
  FileText,
  LogOut,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle
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

// Hall data
const halls = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Dr Abdul Kalam", capacity: 200 },
  { id: "22222222-2222-2222-2222-222222222222", name: "CV Raman", capacity: 400 },
  { id: "33333333-3333-3333-3333-333333333333", name: "Chaguveera", capacity: 80 },
  { id: "44444444-4444-4444-4444-444444444444", name: "Newton Hall", capacity: 200 },
  { id: "55555555-5555-5555-5555-555555555555", name: "R & D", capacity: 150 }
];

export default function AdminDirectBookings() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    event_name: "",
    event_description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    expected_attendees: "",
    reason_for_booking: "",
    hall_id: ""
  });

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expected_attendees: parseInt(formData.expected_attendees),
          type: 'direct', // Mark as direct booking
          admin_id: 'admin-user-id' // You'll need to get this from the session
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Direct booking created successfully!");
        // Reset form
        setFormData({
          event_name: "",
          event_description: "",
          start_date: "",
          end_date: "",
          start_time: "",
          end_time: "",
          expected_attendees: "",
          reason_for_booking: "",
          hall_id: ""
        });
      } else {
        setError(data.message || "Failed to create booking");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div className="mb-8" variants={itemVariants}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Direct Booking
                  </h1>
                  <p className="text-gray-500 text-sm md:text-base mt-0.5">
                    Create direct hall bookings without approval process
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Booking Form */}
            <motion.div variants={itemVariants}>
              <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <div className="h-1 bg-gray-900" />

                <CardHeader className="pb-4 pt-6 px-6 md:px-8">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 border border-gray-200">
                      <Building2 className="h-5 w-5 text-gray-700" />
                    </div>
                    <span className="font-semibold text-gray-900">New Booking Details</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 ml-13">
                    Fill in the details to create a new booking
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-8 px-6 md:px-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Hall Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="hall_id" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        Select Hall <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.hall_id}
                        onValueChange={(value) => handleSelectChange("hall_id", value)}
                      >
                        <SelectTrigger className="h-12 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl">
                          <SelectValue placeholder="Choose a hall" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                          {halls.map((hall) => (
                            <SelectItem key={hall.id} value={hall.id} className="rounded-lg focus:bg-gray-100">
                              <div className="flex items-center gap-3 py-1">
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                                <span className="font-medium text-gray-800">{hall.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {hall.capacity} capacity
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Event Details Section */}
                    <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div className="border-b border-gray-200 pb-2 mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Event Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="event_name" className="text-sm font-medium text-gray-600">
                            Event Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="event_name"
                            name="event_name"
                            value={formData.event_name}
                            onChange={handleInputChange}
                            placeholder="Enter event name"
                            required
                            className="h-11 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expected_attendees" className="text-sm font-medium text-gray-600">
                            Expected Attendees <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="expected_attendees"
                              name="expected_attendees"
                              type="number"
                              value={formData.expected_attendees}
                              onChange={handleInputChange}
                              placeholder="0"
                              min="1"
                              required
                              className="h-11 pl-10 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event_description" className="text-sm font-medium text-gray-600">
                          Description
                        </Label>
                        <Textarea
                          id="event_description"
                          name="event_description"
                          value={formData.event_description}
                          onChange={handleInputChange}
                          placeholder="Enter event description..."
                          rows={3}
                          className="border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl resize-none"
                        />
                      </div>
                    </div>

                    {/* Date and Time Section */}
                    <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div className="border-b border-gray-200 pb-2 mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Schedule
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="start_date" className="text-sm font-medium text-gray-600">
                            Start Date <span className="text-red-500">*</span>
                          </Label>
                          <DatePicker
                            id="start_date"
                            value={formData.start_date}
                            onChange={(date) => handleDateChange("start_date", date)}
                            placeholder="Select start date"
                            minDate={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end_date" className="text-sm font-medium text-gray-600">
                            End Date <span className="text-red-500">*</span>
                          </Label>
                          <DatePicker
                            id="end_date"
                            value={formData.end_date}
                            onChange={(date) => handleDateChange("end_date", date)}
                            placeholder="Select end date"
                            minDate={formData.start_date || new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="start_time" className="text-sm font-medium text-gray-600">
                            Start Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="start_time"
                            name="start_time"
                            type="time"
                            value={formData.start_time}
                            onChange={handleInputChange}
                            required
                            className="h-11 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end_time" className="text-sm font-medium text-gray-600">
                            End Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="end_time"
                            name="end_time"
                            type="time"
                            value={formData.end_time}
                            onChange={handleInputChange}
                            required
                            className="h-11 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reason for Booking */}
                    <div className="space-y-2">
                      <Label htmlFor="reason_for_booking" className="text-sm font-medium text-gray-600">
                        Reason for Booking <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="reason_for_booking"
                        name="reason_for_booking"
                        value={formData.reason_for_booking}
                        onChange={handleInputChange}
                        placeholder="Enter the official reason for booking..."
                        rows={2}
                        required
                        className="border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl resize-none"
                      />
                    </div>

                    {/* Feedback Messages */}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900">Success</h4>
                          <p className="text-green-700 text-sm mt-1">{success}</p>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900">Error</h4>
                          <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 text-base font-semibold bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl group"
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creating Booking...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span>Create Direct Booking</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
