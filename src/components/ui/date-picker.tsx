"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  placeholder?: string;
  id?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Select a date",
  id
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the value to a Date object
  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const minDateObj = minDate ? new Date(minDate + "T00:00:00") : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update current month when value changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value, selectedDate]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (!minDateObj) return false;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minDateOnly = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), minDateObj.getDate());
    return dateOnly < minDateOnly;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;

    // Format as YYYY-MM-DD using local time to avoid timezone offset issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    onChange(formattedDate);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const calendarDays = generateCalendarDays();

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-12 px-4 flex items-center justify-between
          border border-gray-200 rounded-xl bg-white
          hover:border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900
          transition-all duration-200 text-left
          ${!value ? "text-gray-400" : "text-gray-900"}
        `}
      >
        <span className="truncate">
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full min-w-[320px] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
          >
            {/* Calendar Header */}
            <div className="bg-gray-900 text-white p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <h3 className="font-semibold text-lg">
                    {MONTH_NAMES[currentMonth.getMonth()]}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {currentMonth.getFullYear()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3">
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-10" />;
                  }

                  const disabled = isDateDisabled(date);
                  const today = isToday(date);
                  const selected = isSelected(date);

                  return (
                    <motion.button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      disabled={disabled}
                      whileHover={!disabled ? { scale: 1.1 } : {}}
                      whileTap={!disabled ? { scale: 0.95 } : {}}
                      className={`
                        h-10 w-full rounded-lg text-sm font-medium
                        transition-all duration-150
                        ${disabled
                          ? "text-gray-300 cursor-not-allowed"
                          : selected
                            ? "bg-gray-900 text-white shadow-md"
                            : today
                              ? "bg-gray-100 text-gray-900 ring-2 ring-gray-900 ring-inset"
                              : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {date.getDate()}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  if (!minDateObj || today >= minDateObj) {
                    handleDateSelect(today);
                  }
                }}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Today
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DatePicker;
