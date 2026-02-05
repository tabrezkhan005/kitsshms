-- KITS Seminar Hall Management System - Complete Database Schema
-- This file represents the current database schema in production

-- ============================================
-- Users and Authentication Tables
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'faculty', 'clubs')),
    branch VARCHAR(100),
    club_name VARCHAR(100),
    is_email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login Sessions Table (for two-step authentication)
CREATE TABLE IF NOT EXISTS login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    verification_code VARCHAR(10) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Halls Table
-- ============================================

CREATE TABLE IF NOT EXISTS halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default Halls Data
-- INSERT INTO halls (name, capacity, description) VALUES
-- ('Abdul Kalam Hall', 200, 'Main auditorium with advanced audio-visual equipment'),
-- ('Newton Hall', 150, 'Medium-sized hall suitable for workshops and presentations'),
-- ('CV Raman Hall', 100, 'Intimate setting for seminars and discussions'),
-- ('R & D Hall', 80, 'Research and development focused hall with specialized equipment'),
-- ('Che Guevara Hall', 120, 'Multi-purpose hall with flexible seating arrangements');

-- ============================================
-- Booking Requests Tables
-- ============================================

-- Booking Requests Table
CREATE TABLE IF NOT EXISTS booking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    event_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    expected_attendees INTEGER,
    reason_for_booking TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    admin_notes TEXT,
    rejection_reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking Request Halls (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS booking_request_halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_request_id UUID REFERENCES booking_requests(id) ON DELETE CASCADE,
    hall_id UUID REFERENCES halls(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_request_id, hall_id)
);

-- ============================================
-- Direct Bookings Table (Admin Only)
-- ============================================

CREATE TABLE IF NOT EXISTS direct_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id UUID REFERENCES halls(id) ON DELETE CASCADE,
    booked_by UUID REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT NOT NULL,
    attendees_count INTEGER,
    is_unavailable BOOLEAN DEFAULT false,
    unavailability_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Notifications Table
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Login sessions indexes
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_expires ON login_sessions(expires_at);

-- Booking requests indexes
CREATE INDEX IF NOT EXISTS idx_booking_requests_requester ON booking_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_dates ON booking_requests(start_date, end_date);

-- Booking request halls indexes
CREATE INDEX IF NOT EXISTS idx_booking_request_halls_request ON booking_request_halls(booking_request_id);
CREATE INDEX IF NOT EXISTS idx_booking_request_halls_hall ON booking_request_halls(hall_id);

-- Direct bookings indexes
CREATE INDEX IF NOT EXISTS idx_direct_bookings_hall ON direct_bookings(hall_id);
CREATE INDEX IF NOT EXISTS idx_direct_bookings_dates ON direct_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_direct_bookings_booked_by ON direct_bookings(booked_by);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
