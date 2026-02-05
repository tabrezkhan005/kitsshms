'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, Send, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface SeminarHall {
  id: string
  name: string
  capacity: number
  description: string
  is_active: boolean
}

interface BookingRequestFormProps {
  userType: 'faculty' | 'club'
  userId: string
  userName: string
  userEmail: string
}

export default function BookingRequestForm({ userType, userId, userName, userEmail }: BookingRequestFormProps) {
  const [halls, setHalls] = useState<SeminarHall[]>([])
  const [selectedHall, setSelectedHall] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [purpose, setPurpose] = useState<string>('')
  const [attendeesCount, setAttendeesCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>('')
  const [selectedHallDetails, setSelectedHallDetails] = useState<SeminarHall | null>(null)

  // Mock data for development
  useEffect(() => {
    const mockHalls: SeminarHall[] = [
      { id: '1', name: 'Abdul Kalam Hall', capacity: 200, description: 'Main auditorium with advanced audio-visual equipment', is_active: true },
      { id: '2', name: 'Newton Hall', capacity: 150, description: 'Medium-sized hall suitable for workshops and presentations', is_active: true },
      { id: '3', name: 'CV Raman Hall', capacity: 100, description: 'Intimate setting for seminars and discussions', is_active: true },
      { id: '4', name: 'R & D Hall', capacity: 80, description: 'Research and development focused hall with specialized equipment', is_active: true },
      { id: '5', name: 'Che Guevara Hall', capacity: 120, description: 'Multi-purpose hall with flexible seating arrangements', is_active: true }
    ]
    setHalls(mockHalls)
  }, [])

  useEffect(() => {
    if (selectedHall) {
      const hall = halls.find(h => h.id === selectedHall)
      setSelectedHallDetails(hall || null)
    }
  }, [selectedHall, halls])

  const validateForm = () => {
    if (!selectedHall) {
      setError('Please select a seminar hall')
      return false
    }
    if (!startDate || !endDate) {
      setError('Please select start and end dates')
      return false
    }
    if (!startTime || !endTime) {
      setError('Please select start and end times')
      return false
    }
    if (!purpose.trim()) {
      setError('Please provide a purpose for the booking')
      return false
    }
    if (attendeesCount <= 0) {
      setError('Please specify the number of attendees')
      return false
    }
    if (new Date(startDate) < new Date()) {
      setError('Start date cannot be in the past')
      return false
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date')
      return false
    }
    if (selectedHallDetails && attendeesCount > selectedHallDetails.capacity) {
      setError(`Number of attendees exceeds hall capacity (${selectedHallDetails.capacity})`)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const requestData = {
        hall_id: selectedHall,
        requester_id: userId,
        requester_type: userType,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose.trim(),
        attendees_count: attendeesCount,
        requester_name: userName,
        requester_email: userEmail
      }

      // TODO: Replace with actual API call
      console.log('Submitting booking request:', requestData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSuccess(true)
      setSelectedHall('')
      setStartDate('')
      setEndDate('')
      setStartTime('')
      setEndTime('')
      setPurpose('')
      setAttendeesCount(0)
      setSelectedHallDetails(null)

    } catch {
      setError('Failed to submit booking request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Request Seminar Hall Booking
        </h1>
        <p className="text-gray-600">
          Submit a request to book a seminar hall for your {userType === 'faculty' ? 'faculty' : 'club'} event
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Booking Request Form</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Booking request submitted successfully! You will receive an email confirmation once the admin reviews your request.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hall Selection */}
                <div>
                  <Label htmlFor="hall">Select Seminar Hall *</Label>
                  <Select value={selectedHall} onValueChange={setSelectedHall}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a seminar hall" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.filter(hall => hall.is_active).map(hall => (
                        <SelectItem key={hall.id} value={hall.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{hall.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {hall.capacity} capacity
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Hall Details */}
                {selectedHallDetails && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">{selectedHallDetails.name}</h3>
                    <p className="text-blue-700 text-sm mb-2">{selectedHallDetails.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-blue-600">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Capacity: {selectedHallDetails.capacity}
                      </span>
                    </div>
                  </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={getMinDate()}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date *</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || getMinDate()}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-time">Start Time *</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time *</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Purpose and Attendees */}
                <div>
                  <Label htmlFor="purpose">Purpose of Booking *</Label>
                  <Textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe the purpose of your booking (e.g., Faculty Development Program, Club Workshop, etc.)"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="attendees">Expected Number of Attendees *</Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 0)}
                    min="1"
                    max={selectedHallDetails?.capacity || 1000}
                    placeholder="Enter number of attendees"
                    required
                  />
                  {selectedHallDetails && (
                    <p className="text-sm text-gray-500 mt-1">
                      Hall capacity: {selectedHallDetails.capacity} people
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting Request...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Submit Booking Request
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requestor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-sm">{userName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-sm">{userEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <Badge className="capitalize">
                  {userType}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Booking Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Requests must be submitted at least 24 hours in advance</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Admin will review and respond within 48 hours</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>You will receive email notifications for approval/denial</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Please ensure accurate attendee count for capacity planning</p>
              </div>
            </CardContent>
          </Card>

          {/* Available Halls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Halls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {halls.filter(hall => hall.is_active).map(hall => (
                <div key={hall.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{hall.name}</p>
                    <p className="text-xs text-gray-500">{hall.capacity} capacity</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
