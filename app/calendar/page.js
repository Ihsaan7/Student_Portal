"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState({});
  const [user, setUser] = useState(null);
  
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

  // Get user and load notes on component mount
  useEffect(() => {
    const getUserAndNotes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadNotes(user.id);
      }
    };
    getUserAndNotes();
  }, []);

  // Load notes from database
  const loadNotes = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('calendar_notes')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading notes:', error);
        return;
      }

      // Convert array to object with date as key
      const notesObj = {};
      data.forEach(note => {
        const dateKey = note.date;
        notesObj[dateKey] = note.note_text;
      });
      setNotes(notesObj);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  // Handle date click
  const handleDateClick = (date) => {
    if (!date) return;
    
    const dateKey = date.toISOString().split('T')[0];
    setSelectedDate(date);
    setNoteText(notes[dateKey] || "");
    setShowNoteModal(true);
  };

  // Save note
  const handleSaveNote = async () => {
    if (!selectedDate || !user) return;

    const dateKey = selectedDate.toISOString().split('T')[0];
    
    try {
      if (noteText.trim()) {
        // Check if note already exists
        const { data: existingNote } = await supabase
          .from('calendar_notes')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', dateKey)
          .single();

        if (existingNote) {
          // Update existing note
          const { error } = await supabase
            .from('calendar_notes')
            .update({ note_text: noteText.trim() })
            .eq('id', existingNote.id);

          if (error) throw error;
        } else {
          // Insert new note
          const { error } = await supabase
            .from('calendar_notes')
            .insert({
              user_id: user.id,
              date: dateKey,
              note_text: noteText.trim()
            });

          if (error) throw error;
        }

        // Update local state
        setNotes(prev => ({
          ...prev,
          [dateKey]: noteText.trim()
        }));
      } else {
        // Delete note if text is empty
        const { error } = await supabase
          .from('calendar_notes')
          .delete()
          .eq('user_id', user.id)
          .eq('date', dateKey);

        if (error) throw error;

        // Update local state
        const newNotes = { ...notes };
        delete newNotes[dateKey];
        setNotes(newNotes);
      }

      setShowNoteModal(false);
      setSelectedDate(null);
      setNoteText("");
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  // Cancel note editing
  const handleCancelNote = () => {
    setShowNoteModal(false);
    setSelectedDate(null);
    setNoteText("");
  };

  // Get note for a specific date
  const getNoteForDate = (date) => {
    if (!date) return null;
    const dateKey = date.toISOString().split('T')[0];
    return notes[dateKey];
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
            {days.map((day, index) => {
              const note = getNoteForDate(day);
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`p-3 min-h-[80px] border border-gray-100 relative ${
                    day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                  } ${note ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {day.getDate()}
                      </div>
                      {note && (
                        <div className="text-xs text-gray-600 bg-yellow-200 p-1 rounded truncate">
                          📝 {note}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
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

        {/* Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Note for {selectedDate && formatDate(selectedDate)}
              </h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your reminder or note here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleCancelNote}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 