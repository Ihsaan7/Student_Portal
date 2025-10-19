"use client";
import DashboardLayout from "../components/DashboardLayout";
import AuthGuard from "../../components/AuthGuard";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState({});
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
        await loadAnnouncements(user.id);
      }
    };
    getUserAndNotes();
    
    // Handle anchor link navigation to announcements section
    if (window.location.hash === '#announcements') {
      setTimeout(() => {
        const announcementsSection = document.getElementById('announcements-section');
        if (announcementsSection) {
          announcementsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
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

  // Load announcements with read status
  const loadAnnouncements = async (userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_recent_announcements_with_read_status', {
          user_uuid: userId,
          limit_count: 3
        });

      if (error) {
        console.error('Error loading announcements:', error);
        return;
      }

      setAnnouncements(data || []);
      
      // Count unread announcements
      const unread = data?.filter(announcement => !announcement.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  // Mark announcement as read
  const markAnnouncementRead = async (announcementId) => {
    if (!user) return;
    
    try {
      await supabase.rpc('mark_announcement_read', {
        announcement_uuid: announcementId,
        user_uuid: user.id
      });
      
      // Update local state
      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement.id === announcementId 
            ? { ...announcement, is_read: true }
            : announcement
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking announcement as read:', error);
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
    <AuthGuard>
      <DashboardLayout currentPage="/calendar">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Academic Calendar</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>View your schedule, deadlines, and important academic events.</p>
        </div>

        {/* Calendar Navigation */}
        <div className="rounded-lg shadow-sm border p-6 mb-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg transition"
              style={{ 
                color: 'hsl(var(--card-foreground))',
                ':hover': { backgroundColor: 'hsl(var(--muted))' }
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(var(--muted))'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg transition"
              style={{ 
                color: 'hsl(var(--card-foreground))',
                ':hover': { backgroundColor: 'hsl(var(--muted))' }
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(var(--muted))'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
              <div key={day} className="p-3 text-center text-sm font-medium rounded" style={{ color: 'hsl(var(--muted-foreground))', backgroundColor: 'hsl(var(--muted))' }}>
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
                  className={`p-3 min-h-[80px] border relative ${
                    day ? 'cursor-pointer' : ''
                  }`}
                  style={{
                    borderColor: 'hsl(var(--border))',
                    backgroundColor: day 
                      ? (note ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))')
                      : 'hsl(var(--muted))',
                    ':hover': day ? {
                      backgroundColor: note ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))'
                    } : {}
                  }}
                  onMouseEnter={(e) => {
                    if (day) {
                      e.target.style.backgroundColor = note ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (day) {
                      e.target.style.backgroundColor = note ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))';
                    }
                  }}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>
                        {day.getDate()}
                      </div>
                      {note && (
                        <div className="text-xs p-1 rounded truncate" style={{ color: 'hsl(var(--primary-foreground))', backgroundColor: 'hsl(var(--primary))' }}>
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

        {/* Announcements Section */}
        <div id="announcements-section" className="rounded-lg shadow-sm border p-6 mb-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>Recent Announcements</h2>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}>
                {unreadCount} new
              </span>
            )}
          </div>
          
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>No announcements available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="border rounded-lg p-4 transition-colors"
                  style={{
                    borderColor: announcement.is_read 
                      ? 'hsl(var(--border))' 
                      : 'hsl(var(--primary))',
                    backgroundColor: announcement.is_read 
                      ? 'hsl(var(--card))' 
                      : 'hsl(var(--primary) / 0.1)'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
                      {announcement.title}
                      {!announcement.is_read && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></span>
                      )}
                    </h3>
                    <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{announcement.content}</p>
                  
                  {announcement.video_url && (
                    <div className="mb-3">
                      {/* Check if it's a YouTube embed URL */}
                      {announcement.video_url.includes('youtube.com/embed') || announcement.video_url.includes('youtu.be') ? (
                        <iframe
                          src={announcement.video_url}
                          className="w-full max-w-md rounded-lg"
                          style={{ height: '315px' }}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Announcement Video"
                        ></iframe>
                      ) : (
                        <video 
                          controls 
                          className="w-full max-w-md rounded-lg"
                          preload="metadata"
                        >
                          <source src={announcement.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  )}
                  
                  {!announcement.is_read && (
                    <button
                      onClick={() => markAnnouncementRead(announcement.id)}
                      className="text-sm font-medium transition-colors"
                      style={{ color: 'hsl(var(--primary))' }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="rounded-lg p-6 max-w-md w-full mx-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>
                Add Note for {selectedDate && formatDate(selectedDate)}
              </h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your reminder or note here..."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:border-transparent"
                style={{ 
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  '--tw-ring-color': 'hsl(var(--primary))'
                }}
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleCancelNote}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    color: 'hsl(var(--muted-foreground))',
                    backgroundColor: 'hsl(var(--muted))'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </AuthGuard>
  );
}
