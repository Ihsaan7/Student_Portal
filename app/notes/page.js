"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState, useEffect } from "react";

import { supabase } from "../../lib/supabase";

export default function NotesPage() {

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", course: "", tags: "" });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch enrolled courses on component mount
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user found');
          return;
        }

        // Get enrolled courses
        const { data: enrollments, error } = await supabase
          .from('enrolled_courses')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching enrolled courses:', error);
          return;
        }

        // Format courses for dropdown
        const courses = enrollments.map(enrollment => ({
          value: `${enrollment.course_code} - ${enrollment.course_name}`,
          label: `${enrollment.course_code} - ${enrollment.course_name}`
        }));

        setEnrolledCourses(courses);
      } catch (error) {
        console.error('Error loading enrolled courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  const handleCreateNote = () => {
    if (newNote.title && newNote.content && newNote.course) {
      const note = {
        id: Date.now(),
        title: newNote.title,
        content: newNote.content,
        course: newNote.course,
        date: new Date().toISOString().split('T')[0],
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      setNotes([note, ...notes]);
      setNewNote({ title: "", content: "", course: "", tags: "" });
      setSelectedNote(note);
      setIsEditing(false);
    }
  };

  const handleUpdateNote = () => {
    if (selectedNote && newNote.title && newNote.content && newNote.course) {
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { 
              ...note, 
              title: newNote.title, 
              content: newNote.content, 
              course: newNote.course,
              tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            }
          : note
      );
      setNotes(updatedNotes);
      setSelectedNote({ ...selectedNote, title: newNote.title, content: newNote.content, course: newNote.course });
      setIsEditing(false);
    }
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const startEditing = (note) => {
    setSelectedNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      course: note.course,
      tags: note.tags.join(', ')
    });
    setIsEditing(true);
  };

  return (
    <DashboardLayout currentPage="/notes">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>My Notes</h1>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Organize and manage your academic notes across all courses.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="lg:col-span-1">
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>All Notes</h2>
                <button
                  onClick={() => {
                    setSelectedNote(null);
                    setIsEditing(false);
                    setNewNote({ title: "", content: "", course: "", tags: "" });
                  }}
                  className="px-3 py-1 rounded-lg transition text-sm hover:opacity-90"
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                  + New Note
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notes.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>No notes yet</h3>
                    <p className="mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Start organizing your academic notes by creating your first note.</p>
                    <button
                      onClick={() => {
                        setSelectedNote(null);
                        setIsEditing(false);
                        setNewNote({ title: "", content: "", course: "", tags: "" });
                      }}
                      className="px-4 py-2 rounded-lg transition hover:opacity-90"
                      style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                      Create Your First Note
                    </button>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNote(note);
                        setIsEditing(false);
                      }}
                      className="p-3 border rounded-lg cursor-pointer transition hover:opacity-80"
                      style={{
                        borderColor: selectedNote?.id === note.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        backgroundColor: selectedNote?.id === note.id ? 'hsl(var(--primary) / 0.1)' : 'transparent'
                      }}
                    >
                      <h3 className="font-medium mb-1 truncate" style={{ color: 'hsl(var(--card-foreground))' }}>{note.title}</h3>
                      <p className="text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{note.course}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{note.date}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                            +{note.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Note Editor/Viewer */}
          <div className="lg:col-span-2">
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              {selectedNote && !isEditing ? (
                /* Note Viewer */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>{selectedNote.title}</h2>
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedNote.course}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(selectedNote)}
                        className="px-3 py-1 rounded-lg transition text-sm hover:opacity-90"
                        style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        className="px-3 py-1 rounded-lg transition text-sm hover:opacity-90"
                        style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 text-sm rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap" style={{ color: 'hsl(var(--card-foreground))' }}>{selectedNote.content}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Created: {selectedNote.date}</p>
                  </div>
                </div>
              ) : (
                /* Note Editor */
                <div>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>
                    {isEditing ? 'Edit Note' : 'Create New Note'}
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>Title</label>
                      <input
                        type="text"
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--foreground))',
                          '--tw-ring-color': 'hsl(var(--primary))'
                        }}
                        placeholder="Enter note title..."
                        suppressHydrationWarning={true}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>Course</label>
                      <select
                        value={newNote.course}
                        onChange={(e) => setNewNote({ ...newNote, course: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--foreground))',
                          '--tw-ring-color': 'hsl(var(--primary))'
                        }}
                        disabled={loading}
                      >
                        <option value="">
                          {loading ? 'Loading courses...' : enrolledCourses.length === 0 ? 'No enrolled courses' : 'Select a course...'}
                        </option>
                        {enrolledCourses.map((course) => (
                          <option key={course.value} value={course.value}>{course.label}</option>
                        ))}
                      </select>
                      {enrolledCourses.length === 0 && !loading && (
                        <p className="text-sm mt-1" style={{ color: 'hsl(var(--destructive))' }}>
                          You need to enroll in courses first. Go to the Home page to enroll.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>Content</label>
                      <textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        rows={8}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--foreground))',
                          '--tw-ring-color': 'hsl(var(--primary))'
                        }}
                        placeholder="Write your notes here..."
                        suppressHydrationWarning={true}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={newNote.tags}
                        onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--foreground))',
                          '--tw-ring-color': 'hsl(var(--primary))'
                        }}
                        placeholder="e.g., programming, variables, basics"
                        suppressHydrationWarning={true}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={isEditing ? handleUpdateNote : handleCreateNote}
                        className="px-4 py-2 rounded-lg transition hover:opacity-90"
                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                      >
                        {isEditing ? 'Update Note' : 'Create Note'}
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedNote(null);
                          }}
                          className="px-4 py-2 rounded-lg transition hover:opacity-90"
                          style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}