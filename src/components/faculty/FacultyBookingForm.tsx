"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  Check
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";

// Types for API data
interface Hall {
  id: string;
  name: string;
  capacity: number;
  description: string;
  location: string;
  amenities: string[];
  is_active: boolean;
}

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

interface BookingFormData {
  eventTitle: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: string;
  organizerName: string;
  contactEmail: string;
  contactPhone: string;
  additionalRequirements: string;
}

export default function FacultyBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [hallAvailability, setHallAvailability] = useState<HallAvailability[]>([]);
  const [selectedHalls, setSelectedHalls] = useState<string[]>([]);
  const [formData, setFormData] = useState<BookingFormData>({
    eventTitle: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: "",
    organizerName: "",
    contactEmail: "",
    contactPhone: "",
    additionalRequirements: ""
  });

  // Fetch halls on component mount
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const response = await fetch('/api/halls?is_active=true');
        const data = await response.json();
        if (data.success) {
          setHalls(data.data);
        }
      } catch (error) {
        console.error('Error fetching halls:', error);
      }
    };

    fetchHalls();
  }, []);

  // Get pre-filled date from URL params
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setFormData(prev => ({
        ...prev,
        startDate: dateParam,
        endDate: dateParam
      }));
    }
  }, [searchParams]);

  // Fetch hall availability when date changes
  const fetchHallAvailability = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      // Fetch availability for each date in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allAvailability: HallAvailability[] = [];

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const response = await fetch(`/api/halls/availability?date=${dateString}`);

        // Check if response is ok before parsing JSON
        if (!response.ok) {
          console.error('Error fetching hall availability:', response.status, response.statusText);
          continue;
        }

        try {
          const data = await response.json();

          if (data.success && data.data) {
            // Merge availability data, keeping the worst status (booked > pending > available)
            data.data.forEach((hall: HallAvailability) => {
              const existingHall = allAvailability.find(h => h.id === hall.id);
              if (!existingHall) {
                allAvailability.push(hall);
              } else {
                // Update status to worst case
                if (hall.status === 'booked' || existingHall.status === 'booked') {
                  existingHall.status = 'booked';
                  existingHall.booking = hall.booking;
                } else if (hall.status === 'pending' || existingHall.status === 'pending') {
                  existingHall.status = 'pending';
                  existingHall.booking = hall.booking;
                }
              }
            });
          }
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
        }
      }

      setHallAvailability(allAvailability);
    } catch (error) {
      console.error('Error fetching hall availability:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date changes
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);

    // If both dates are set, fetch availability
    if (newFormData.startDate && newFormData.endDate) {
      fetchHallAvailability(newFormData.startDate, newFormData.endDate);
    }
  };

  // Handle hall selection
  const handleHallSelection = (hallId: string) => {
    setSelectedHalls(prev =>
      prev.includes(hallId)
        ? prev.filter(id => id !== hallId)
        : [...prev, hallId]
    );
  };

  // Handle form input changes
  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate total capacity of selected halls
  const totalCapacity = selectedHalls.reduce((total, hallId) => {
    const hall = halls.find(h => h.id === hallId);
    return total + (hall?.capacity || 0);
  }, 0);

  // Get hall availability status
  const getHallAvailabilityStatus = (hallId: string) => {
    const availability = hallAvailability.find(h => h.id === hallId);
    return availability?.status || 'available';
  };

  // Get hall status display
  const getHallStatusDisplay = (hallId: string) => {
    const status = getHallAvailabilityStatus(hallId);
    switch (status) {
      case "available":
        return {
          badge: <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>,
          canSelect: true,
          message: "Available for booking"
        };
      case "pending":
        return {
          badge: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Request</Badge>,
          canSelect: true, // Faculty can still request pending halls
          message: "Faculty Privilege: You can still request this hall even though it's pending approval."
        };
      case "booked":
        return {
          badge: <Badge variant="secondary" className="bg-red-100 text-red-800">Booked</Badge>,
          canSelect: false,
          message: "This hall is already booked for the selected dates"
        };
      default:
        return {
          badge: <Badge variant="secondary">Unknown</Badge>,
          canSelect: true,
          message: "Status unknown"
        };
    }
  };

  // Get booking details for a hall
  const getHallBookingDetails = (hallId: string) => {
    const availability = hallAvailability.find(h => h.id === hallId);
    return availability?.booking;
  };

  // Check if same-day booking
  const isSameDayBooking = () => {
    const today = new Date().toISOString().split('T')[0];
    return formData.startDate === today;
  };

  // Validation functions
  const validateStep1 = () => {
    return formData.startDate && formData.endDate && selectedHalls.length > 0;
  };

  const validateStep2 = () => {
    return formData.eventTitle && formData.purpose && formData.attendees &&
           formData.organizerName && formData.contactEmail &&
           formData.startTime && formData.endTime;
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);

    try {
      if (!userId) {
        alert("User session not found. Please log in again.");
        return;
      }
      const requester_id = userId;

      const response = await fetch('/api/booking-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requester_id,
          event_name: formData.eventTitle,
          event_description: formData.additionalRequirements,
          start_date: formData.startDate,
          end_date: formData.endDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          expected_attendees: parseInt(formData.attendees),
          reason_for_booking: formData.purpose,
          hall_ids: selectedHalls
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        console.error('Error submitting booking request:', response.status, response.statusText);
        alert("Failed to submit booking request. Please try again.");
        return;
      }

      try {
        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push("/faculty/dashboard");
          }, 3000);
        } else {
          alert(data.message || "Failed to submit booking request. Please try again.");
        }
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        alert("Failed to submit booking request. Please try again.");
      }
    } catch (error) {
      console.error('Error submitting booking request:', error);
      alert("Failed to submit booking request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8 animate-in fade-in zoom-in duration-500">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-700 delay-200">
              <Check className="w-10 h-10 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your booking request has been successfully sent to the admin. You will be notified via email once it is reviewed.
            </p>
            <div className="space-y-4 w-full">
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 animate-[progress_3s_ease-in-out_forwards]" style={{ width: '0%' }} />
              </div>
              <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
              <Button
                onClick={() => router.push("/faculty/dashboard")}
                className="w-full bg-gray-900 hover:bg-black text-white"
              >
                Go to Dashboard Now
              </Button>
            </div>
          </CardContent>
        </Card>
        <style jsx global>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Seminar Halls</h1>
            <p className="text-gray-600">Step {currentStep} of 3: Multi-step booking process</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="font-medium">Date & Hall Selection</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="font-medium">Event Details</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Same-day booking notice */}
        {isSameDayBooking() && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-900" />
              <div>
                <h3 className="font-semibold text-gray-900">Same-Day Booking</h3>
                <p className="text-gray-700 text-sm">
                  You are booking for today. Please note that same-day bookings are subject to immediate availability and admin approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Date and Hall Selection */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 1: Select Date and Halls
              </CardTitle>
              <CardDescription>
                Choose your booking dates and select available halls based on their availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="mb-2 block">Start Date *</Label>
                  <DatePicker
                    id="startDate"
                    value={formData.startDate}
                    onChange={(date) => handleDateChange("startDate", date)}
                    minDate={new Date().toISOString().split('T')[0]}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="mb-2 block">End Date *</Label>
                  <DatePicker
                    id="endDate"
                    value={formData.endDate}
                    onChange={(date) => handleDateChange("endDate", date)}
                    minDate={formData.startDate || new Date().toISOString().split('T')[0]}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              {/* Hall Selection */}
              {formData.startDate && formData.endDate && (
                <div>
                  <Label className="text-base font-medium">Select Halls *</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Halls are shown based on availability for your selected dates. You can select multiple halls.
                  </p>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <span className="ml-2">Checking hall availability...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {halls.map((hall) => {
                        const statusDisplay = getHallStatusDisplay(hall.id);
                        const isSelected = selectedHalls.includes(hall.id);
                        const bookingDetails = getHallBookingDetails(hall.id);

                        return (
                          <div key={hall.id} className={`border rounded-lg p-4 ${
                            !statusDisplay.canSelect ? 'opacity-60 bg-gray-50' : 'hover:bg-gray-50'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={hall.id}
                                checked={isSelected}
                                onCheckedChange={() => handleHallSelection(hall.id)}
                                disabled={!statusDisplay.canSelect}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <Label
                                    htmlFor={hall.id}
                                    className={`text-lg font-semibold cursor-pointer ${
                                      !statusDisplay.canSelect ? 'text-gray-500' : ''
                                    }`}
                                  >
                                    {hall.name}
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{hall.capacity} capacity</Badge>
                                    {statusDisplay.badge}
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-2">{hall.description}</p>

                                {/* Status Message */}
                                <div className={`p-2 rounded text-xs ${
                                  statusDisplay.canSelect ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-600'
                                }`}>
                                  {statusDisplay.message}
                                </div>

                                {/* Booking Details for Pending/Booked Halls */}
                                {bookingDetails && (
                                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2 text-yellow-800">Existing Booking:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-yellow-700">
                                      <div><strong>Event:</strong> {bookingDetails.event_name}</div>
                                      <div><strong>Requester:</strong> {bookingDetails.requester_name}</div>
                                      <div><strong>Time:</strong> {bookingDetails.start_time} - {bookingDetails.end_time}</div>
                                      <div><strong>Attendees:</strong> {bookingDetails.expected_attendees || 'Not specified'}</div>
                                    </div>
                                    <div className="mt-2">
                                      <strong>Reason:</strong>
                                      <p className="text-xs mt-1">{bookingDetails.reason_for_booking}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedHalls.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          Selected: {selectedHalls.length} hall{selectedHalls.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-700">
                          Total Capacity: {totalCapacity} people
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Event Details Form */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Step 2: Event Details
              </CardTitle>
              <CardDescription>
                Provide information about your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Title */}
              <div>
                <Label htmlFor="eventTitle">Event Title *</Label>
                <Input
                  id="eventTitle"
                  value={formData.eventTitle}
                  onChange={(e) => handleInputChange("eventTitle", e.target.value)}
                  placeholder="Enter the title of your event"
                  required
                />
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Purpose and Attendees */}
              <div>
                <Label htmlFor="purpose">Purpose of Booking *</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange("purpose", e.target.value)}
                  placeholder="Describe the purpose and nature of your event"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="attendees">Expected Number of Attendees *</Label>
                <Input
                  id="attendees"
                  type="number"
                  value={formData.attendees}
                  onChange={(e) => handleInputChange("attendees", e.target.value)}
                  min="1"
                  max={totalCapacity}
                  placeholder="Enter number of attendees"
                  required
                />
                {totalCapacity > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum capacity of selected halls: {totalCapacity} people
                  </p>
                )}
              </div>

              {/* Organizer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizerName">Organizer Name *</Label>
                  <Input
                    id="organizerName"
                    type="text"
                    value={formData.organizerName}
                    onChange={(e) => handleInputChange("organizerName", e.target.value)}
                    placeholder="Enter organizer name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="Enter contact email"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  placeholder="Enter contact phone number"
                />
              </div>

              {/* Additional Requirements */}
              <div>
                <Label htmlFor="additionalRequirements">Additional Requirements</Label>
                <Textarea
                  id="additionalRequirements"
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange("additionalRequirements", e.target.value)}
                  placeholder="Any special requirements (AV equipment, seating arrangement, etc.)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation Summary */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Step 3: Confirmation Summary
              </CardTitle>
              <CardDescription>
                Review your booking details before submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3">Event Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Event:</strong> {formData.eventTitle}</p>
                    <p><strong>Date:</strong> {formData.startDate} {formData.startDate !== formData.endDate && `to ${formData.endDate}`}</p>
                    <p><strong>Time:</strong> {formData.startTime} - {formData.endTime}</p>
                    <p><strong>Attendees:</strong> {formData.attendees} people</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-3">Selected Halls</h4>
                  <div className="space-y-2 text-sm">
                    {selectedHalls.map(hallId => {
                      const hall = halls.find(h => h.id === hallId);
                      return hall ? (
                        <div key={hall.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium">{hall.name}</p>
                            <p className="text-gray-500">{hall.capacity} capacity</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        </div>
                      ) : null;
                    })}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Capacity:</span>
                        <span className="font-semibold text-gray-900">{totalCapacity} people</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organizer Information */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Organizer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Name:</strong> {formData.organizerName}</p>
                  <p><strong>Email:</strong> {formData.contactEmail}</p>
                  {formData.contactPhone && <p><strong>Phone:</strong> {formData.contactPhone}</p>}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Purpose</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {formData.purpose}
                </p>
              </div>

              {/* Additional Requirements */}
              {formData.additionalRequirements && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">Additional Requirements</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {formData.additionalRequirements}
                  </p>
                </div>
              )}

              {/* Confirmation Message */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-900" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Booking Request</h3>
                                         <p className="text-gray-700 text-sm">
                       By clicking &quot;Confirm & Submit&quot;, you agree to submit this booking request for admin approval.
                       You will be notified via email once the admin responds to your request.
                     </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !validateStep1()) ||
                  (currentStep === 2 && !validateStep2())
                }
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateStep2()}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Confirm & Submit
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
