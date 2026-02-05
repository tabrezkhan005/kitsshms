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
  Users2,
  CheckCircle,
  Check
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
  description: string;
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

export default function ClubBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [hallAvailability, setHallAvailability] = useState<HallAvailability[]>([]);
  const [selectedHalls, setSelectedHalls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
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
    clubName: "",
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
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          canSelect: false, // Clubs cannot select pending halls
          message: "This hall has a pending request and cannot be selected"
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
           formData.startTime && formData.endTime && formData.clubName;
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
      // Use the actual club user ID from the database
      const requester_id = "a3072456-c8c8-4f81-8bdb-b584119d533f"; // Club user ID

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
          alert("Your booking request has been submitted! The admin will respond to your request.");
          router.push("/club/dashboard");
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

  // Calculate total capacity of selected halls
  const totalCapacity = selectedHalls.reduce((total, hallId) => {
    const hall = halls.find(h => h.id === hallId);
    return total + (hall?.capacity || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">9
      <div className="max-w-6xl mx-auto">
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
            <p className="text-gray-600">Submit a booking request for your club event</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-900' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-900 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="font-medium">Select Dates & Halls</span>
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-900' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-900' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-900 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="font-medium">Event Details</span>
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-900' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-900' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-900 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-medium">Confirm & Submit</span>
            </div>
          </div>
        </div>

        {/* Club booking notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Club Booking Guidelines</h3>
              <p className="text-blue-700 text-sm">
                Clubs cannot book halls that are in &quot;pending&quot; status. Only available halls can be selected for booking requests.
              </p>
            </div>
          </div>
        </div>

        {/* Same-day booking notice */}
        {isSameDayBooking() && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Same-Day Booking</h3>
                <p className="text-yellow-700 text-sm">
                  You are booking for today. Please note that same-day bookings are subject to immediate availability and admin approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Date & Hall Selection */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 1: Select Dates & Halls
              </CardTitle>
              <CardDescription>
                Choose your event dates and select available halls. Halls are shown based on availability for your selected dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleDateChange("startDate", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleDateChange("endDate", e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* Hall Selection */}
              <div>
                <h3 className="font-semibold mb-4">Available Halls</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Halls are shown based on availability for your selected dates. You can select multiple halls.
                </p>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading hall availability...</span>
                  </div>
                ) : hallAvailability.length > 0 ? (
                  <div className="space-y-4">
                    {hallAvailability.map((hall) => {
                      const statusDisplay = getHallStatusDisplay(hall.id);
                      const isSelected = selectedHalls.includes(hall.id);
                      const bookingDetails = getHallBookingDetails(hall.id);

                      return (
                        <div key={hall.id} className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 ${
                          !statusDisplay.canSelect ? 'opacity-60' : ''
                        }`}>
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
                              statusDisplay.canSelect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {statusDisplay.message}
                            </div>

                            {/* Show existing booking details for pending/booked halls */}
                            {bookingDetails && !statusDisplay.canSelect && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <p><strong>Existing Booking:</strong> {bookingDetails.event_name}</p>
                                <p><strong>Requester:</strong> {bookingDetails.requester_name} ({bookingDetails.requester_role})</p>
                                <p><strong>Time:</strong> {bookingDetails.start_time} - {bookingDetails.end_time}</p>
                                <p><strong>Reason:</strong> {bookingDetails.reason_for_booking}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {formData.startDate && formData.endDate ? 'No halls available for the selected dates.' : 'Please select dates to see available halls.'}
                  </div>
                )}

                {selectedHalls.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-800">
                        Selected: {selectedHalls.length} hall{selectedHalls.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-blue-600">
                        Total Capacity: {totalCapacity} people
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={!validateStep1()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Event Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 2: Event Details
              </CardTitle>
              <CardDescription>
                Provide information about your club event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Club Name */}
              <div>
                <Label htmlFor="clubName">Club Name *</Label>
                <Input
                  id="clubName"
                  value={formData.clubName}
                  onChange={(e) => handleInputChange("clubName", e.target.value)}
                  placeholder="Enter your club name"
                  required
                />
              </div>

              {/* Event Title */}
              <div>
                <Label htmlFor="eventTitle">Event Title *</Label>
                <Input
                  id="eventTitle"
                  value={formData.eventTitle}
                  onChange={(e) => handleInputChange("eventTitle", e.target.value)}
                  placeholder="Enter the title of your club event"
                  required
                />
              </div>

              {/* Time */}
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
                  placeholder="Describe the purpose and nature of your club event"
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

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Step
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!validateStep2()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Step 3: Confirm & Submit
              </CardTitle>
              <CardDescription>
                Review your booking details before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Booking Summary</h3>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Event Title</Label>
                    <p className="text-lg">{formData.eventTitle}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Club Name</Label>
                    <p className="text-lg">{formData.clubName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date Range</Label>
                    <p className="text-lg">{formData.startDate} to {formData.endDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Time</Label>
                    <p className="text-lg">{formData.startTime} - {formData.endTime}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Expected Attendees</Label>
                    <p className="text-lg">{formData.attendees} people</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Hall Capacity</Label>
                    <p className="text-lg">{totalCapacity} people</p>
                  </div>
                </div>

                {/* Selected Halls */}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Selected Halls</Label>
                  <div className="mt-2 space-y-2">
                    {selectedHalls.map(hallId => {
                      const hall = halls.find(h => h.id === hallId);
                      return hall ? (
                        <div key={hall.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium">{hall.name}</p>
                            <p className="text-sm text-gray-500">{hall.capacity} capacity</p>
                          </div>
                          <Badge variant="secondary">Selected</Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                  <p className="text-lg">{formData.purpose}</p>
                </div>

                {/* Organizer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Organizer</Label>
                    <p className="text-lg">{formData.organizerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Contact Email</Label>
                    <p className="text-lg">{formData.contactEmail}</p>
                  </div>
                </div>

                {formData.contactPhone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Contact Phone</Label>
                    <p className="text-lg">{formData.contactPhone}</p>
                  </div>
                )}

                {formData.additionalRequirements && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Additional Requirements</Label>
                    <p className="text-lg">{formData.additionalRequirements}</p>
                  </div>
                )}
              </div>

              {/* Confirmation Message */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800">Booking Request</h3>
                <p className="text-blue-700 text-sm">
                  By clicking &quot;Confirm & Submit&quot;, you agree to submit this booking request for admin approval.
                  You will be notified via email once the admin responds to your request.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Step
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Confirm & Submit
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
