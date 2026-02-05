"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, Users } from "lucide-react";

// Types for hall availability data
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

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  availability: HallAvailability[];
}

interface HallCalendarProps {
  className?: string;
  compact?: boolean; // For sidebar use
}

export default function HallCalendar({ className = "", compact = false }: HallCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<HallAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, string>>({});

  // Generate calendar days for the current month
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        availability: [] // Will be populated when date is selected
      });
    }

    return days;
  };

  // Fetch hall availability for a specific date
  const fetchHallAvailability = async (date: Date) => {
    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await fetch(`/api/halls/availability?date=${dateString}`);

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.error('Error fetching hall availability:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

  // Handle date selection
  const handleDateClick = async (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;

    setSelectedDate(day.date);
    const availability = await fetchHallAvailability(day.date);
    setSelectedDayData(availability);
    setShowModal(true);
  };

  // Get status color for a day (simplified for sidebar)
  const getDayStatusColor = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return 'text-gray-300';

    if (compact) {
      // For sidebar, use a simple approach without API calls
      const dateString = day.date.toISOString().split('T')[0];
      const status = monthAvailability[dateString];

      if (status === 'booked') return 'bg-red-500 text-white';
      if (status === 'pending') return 'bg-yellow-500 text-white';
      return 'bg-green-500 text-white';
    }

    // For full calendar, use API data
    return 'bg-green-500 text-white'; // Default
  };

  // Fetch month overview for sidebar calendar
  const fetchMonthOverview = async (date: Date) => {
    if (compact) {
      try {
        const year = date.getFullYear();
        const month = date.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const response = await fetch(`/api/halls/availability?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`);

        if (response.ok) {
          const data = await response.json();
          // Process the data to create a simple overview
          const overview: Record<string, string> = {};
          // This would be populated with actual data
          return overview;
        }
      } catch (error) {
        console.error('Error fetching month overview:', error);
      }
    }
    return {};
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    if (compact) {
      fetchMonthOverview(newDate).then(setMonthAvailability);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    if (compact) {
      fetchMonthOverview(newDate).then(setMonthAvailability);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    if (compact) {
      fetchMonthOverview(new Date()).then(setMonthAvailability);
    }
  };

  // Load month overview on mount and when month changes
  useEffect(() => {
    if (compact) {
      fetchMonthOverview(currentDate).then(setMonthAvailability);
    }
  }, [currentDate, compact]);

  const calendarDays = generateCalendarDays(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {compact ? 'Calendar' : 'Hall Availability Calendar'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="p-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              {!compact && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="mt-1 text-xs"
                >
                  Today
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className={`text-center text-xs font-medium p-1 ${
                  compact ? 'text-gray-600' : 'text-gray-700'
                }`}
              >
                {compact ? day[0] : day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 text-xs relative ${
                  !day.isCurrentMonth ? 'text-gray-300' : ''
                } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleDateClick(day)}
                disabled={!day.isCurrentMonth}
              >
                <span className={day.isToday ? 'font-bold' : ''}>
                  {day.day}
                </span>

                {/* Status indicator */}
                {day.isCurrentMonth && (
                  <div
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${getDayStatusColor(day)}`}
                  />
                )}
              </Button>
            ))}
          </div>

          {/* Legend */}
          {!compact && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Booked</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hall Availability Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Hall Availability - {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
            <DialogDescription>
              View the status of all halls for the selected date
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading availability...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayData.length > 0 ? (
                selectedDayData.map((hall) => (
                  <Card key={hall.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{hall.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={
                            hall.status === 'available' ? 'bg-green-100 text-green-800' :
                            hall.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {hall.status === 'available' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {hall.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {hall.status === 'booked' && <XCircle className="w-3 h-3 mr-1" />}
                            {hall.status.charAt(0).toUpperCase() + hall.status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Capacity: {hall.capacity}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {hall.status === 'available' && (
                        <div className="text-green-700 bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Available for booking</span>
                          </div>
                        </div>
                      )}

                      {hall.status === 'pending' && hall.booking && (
                        <div className="text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">Pending Approval</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Event:</span> {hall.booking.event_name}
                              </div>
                              <div>
                                <span className="font-medium">Requester:</span> {hall.booking.requester_name}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {hall.booking.start_time} - {hall.booking.end_time}
                              </div>
                              <div>
                                <span className="font-medium">Attendees:</span> {hall.booking.expected_attendees || 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Reason:</span>
                              <p className="mt-1 text-sm">{hall.booking.reason_for_booking}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {hall.status === 'booked' && hall.booking && (
                        <div className="text-red-700 bg-red-50 p-3 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              <span className="font-medium">Booked</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Event:</span> {hall.booking.event_name}
                              </div>
                              <div>
                                <span className="font-medium">Booked by:</span> {hall.booking.requester_name}
                              </div>
                              <div>
                                <span className="font-medium">Role:</span> {hall.booking.requester_role}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {hall.booking.start_time} - {hall.booking.end_time}
                              </div>
                              <div>
                                <span className="font-medium">Attendees:</span> {hall.booking.expected_attendees || 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Reason:</span>
                              <p className="mt-1 text-sm">{hall.booking.reason_for_booking}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No hall data available for this date</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
