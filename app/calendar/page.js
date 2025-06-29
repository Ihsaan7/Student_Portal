"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState } from "react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = getDaysInMonth(currentDate);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  return (
    <DashboardLayout currentPage="/calendar">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Calendar</h1>
          <p className="text-gray-600">View your schedule, deadlines, and important academic events.</p>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days.map((day, index) => (
              <div
                key={index}
                className={`p-3 min-h-[80px] border border-gray-100 ${
                  day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                }`}
              >
                {day && (
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {day.getDate()}
                  </div>
                )}
                {/* Event indicators would go here */}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Assignment Deadline</p>
                <p className="text-sm text-gray-600">CS101 - Programming Fundamentals</p>
                <p className="text-xs text-red-600">Due: Dec 15, 2024</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Exam Schedule</p>
                <p className="text-sm text-gray-600">Mathematics Final Exam</p>
                <p className="text-xs text-blue-600">Dec 20, 2024 - 10:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 