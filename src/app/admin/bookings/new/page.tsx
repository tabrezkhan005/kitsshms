"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  ArrowLeft,
  Plus,
  Save,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Mail,
  Phone,
  User,
  FileText,
  CheckCircle2,
  Info,
  Shield
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hall: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: "",
    organizer: "",
    contactEmail: "",
    contactPhone: ""
  });

  const halls = [
    { id: "1", name: "Abdul Kalam Hall", capacity: 200 },
    { id: "2", name: "Newton Hall", capacity: 150 },
    { id: "3", name: "CV Raman Hall", capacity: 100 },
    { id: "4", name: "R & D Hall", capacity: 80 },
    { id: "5", name: "Che Guevara Hall", capacity: 120 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setLoading(false);
    router.push("/admin/dashboard");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-white">
      <motion.div
        className="p-6 md:p-8 lg:p-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-10"
            variants={itemVariants}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="w-fit flex items-center gap-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200 group rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="font-medium text-gray-700">Back</span>
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Create New Booking
                  </h1>
                  <p className="text-gray-500 text-sm md:text-base mt-0.5">
                    Direct booking for seminar halls
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <motion.div
              className="lg:col-span-2"
              variants={itemVariants}
            >
              <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                {/* Card Header Accent */}
                <div className="h-1 bg-gray-900" />

                <CardHeader className="pb-4 pt-6 px-6">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 border border-gray-200">
                      <FileText className="h-5 w-5 text-gray-700" />
                    </div>
                    <span className="font-semibold text-gray-900">Booking Details</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 ml-13">
                    Fill in the details for the new booking
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-8 px-6">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Hall Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="hall" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        Select Seminar Hall
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.hall} onValueChange={(value) => handleInputChange("hall", value)}>
                        <SelectTrigger className="h-12 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl">
                          <SelectValue placeholder="Choose a seminar hall" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                          {halls.map(hall => (
                            <SelectItem key={hall.id} value={hall.id} className="rounded-lg focus:bg-gray-100">
                              <div className="flex items-center gap-3 py-1">
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                                <span className="font-medium text-gray-800">{hall.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {hall.capacity} seats
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date and Time Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-800">Date & Time</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-date" className="text-sm font-medium text-gray-600">
                            Start Date <span className="text-red-500">*</span>
                          </Label>
                          <DatePicker
                            id="start-date"
                            value={formData.startDate}
                            onChange={(date) => handleInputChange("startDate", date)}
                            minDate={getTodayDate()}
                            placeholder="Select start date"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end-date" className="text-sm font-medium text-gray-600">
                            End Date <span className="text-red-500">*</span>
                          </Label>
                          <DatePicker
                            id="end-date"
                            value={formData.endDate}
                            onChange={(date) => handleInputChange("endDate", date)}
                            minDate={formData.startDate || getTodayDate()}
                            placeholder="Select end date"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="start-time" className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            Start Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => handleInputChange("startTime", e.target.value)}
                            required
                            className="h-12 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end-time" className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            End Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => handleInputChange("endTime", e.target.value)}
                            required
                            className="h-12 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Event Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-800">Event Details</span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purpose" className="text-sm font-medium text-gray-600">
                          Purpose of Booking <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="purpose"
                          value={formData.purpose}
                          onChange={(e) => handleInputChange("purpose", e.target.value)}
                          placeholder="Describe the purpose of the booking (e.g., Faculty Development Program, Workshop, Seminar...)"
                          rows={3}
                          required
                          className="border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attendees" className="flex items-center gap-2 text-sm font-medium text-gray-600">
                          <Users className="w-4 h-4 text-gray-400" />
                          Expected Number of Attendees <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="attendees"
                          type="number"
                          value={formData.attendees}
                          onChange={(e) => handleInputChange("attendees", e.target.value)}
                          min="1"
                          placeholder="Enter number of attendees"
                          required
                          className="h-12 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-800">Organizer Information</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="organizer" className="text-sm font-medium text-gray-600">
                            Organizer Name <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="organizer"
                              type="text"
                              value={formData.organizer}
                              onChange={(e) => handleInputChange("organizer", e.target.value)}
                              placeholder="Enter organizer name"
                              required
                              className="h-12 pl-11 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contact-email" className="text-sm font-medium text-gray-600">
                            Contact Email <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="contact-email"
                              type="email"
                              value={formData.contactEmail}
                              onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                              placeholder="Enter contact email"
                              required
                              className="h-12 pl-11 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-phone" className="text-sm font-medium text-gray-600">
                          Contact Phone <span className="text-gray-400 font-normal">(Optional)</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="contact-phone"
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                            placeholder="Enter contact phone number"
                            className="h-12 pl-11 border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 text-base font-semibold bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creating Booking...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Save className="h-5 w-5" />
                            <span>Create Booking</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Information Panel */}
            <motion.div
              className="space-y-6"
              variants={itemVariants}
            >
              {/* Booking Guidelines */}
              <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <div className="h-1 bg-gray-900" />
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 border border-gray-200">
                      <Shield className="h-4 w-4 text-gray-700" />
                    </div>
                    <span className="font-semibold text-gray-900">Booking Guidelines</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm px-5 pb-5">
                  {[
                    "Direct bookings are immediately confirmed",
                    "Ensure accurate attendee count for capacity planning",
                    "Contact information is required for coordination",
                    "Bookings cannot overlap with existing events"
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.08 }}
                    >
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-600 leading-relaxed">{item}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Available Halls */}
              <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <div className="h-1 bg-gray-700" />
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 border border-gray-200">
                      <Building2 className="h-4 w-4 text-gray-700" />
                    </div>
                    <span className="font-semibold text-gray-900">Available Halls</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-5 pb-5">
                  {halls.map((hall, index) => (
                    <motion.div
                      key={hall.id}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100/70 transition-all duration-200 cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.06 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">{hall.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {hall.capacity} capacity
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white px-2.5 py-1.5 rounded-full border border-gray-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Available
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <motion.div
                className="p-4 rounded-2xl bg-gray-50 border border-gray-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 flex-shrink-0">
                    <Info className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">Quick Tip</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Select your preferred hall first to check capacity before specifying the attendee count.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
