"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState } from "react";

export default function NotesPage() {
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Programming Fundamentals - Week 1",
      content: "Introduction to variables, data types, and basic syntax. Key concepts: int, float, string, boolean. Remember to always initialize variables before use.",
      course: "CS101 - Programming Fundamentals",
      date: "2024-12-10",
      tags: ["programming", "basics", "variables"]
    },
    {
      id: 2,
      title: "Calculus II - Integration Techniques",
      content: "Integration by parts formula: ∫udv = uv - ∫vdu. Common applications: exponential functions, logarithmic functions, trigonometric functions.",
      course: "MATH201 - Calculus II",
      date: "2024-12-08",
      tags: ["calculus", "integration", "mathematics"]
    },
    {
      id: 3,
      title: "Academic Writing - Essay Structure",
      content: "Five-paragraph essay structure: Introduction (hook, background, thesis), Body paragraphs (topic sentence, evidence, analysis), Conclusion (restate thesis, summarize, closing thought).",
      course: "ENG101 - Academic Writing",
      date: "2024-12-05",
      tags: ["writing", "essay", "structure"]
    }
  ]);

  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", course: "", tags: "" });

  const courses = [
    "CS101 - Programming Fundamentals",
    "MATH201 - Calculus II", 
    "ENG101 - Academic Writing",
    "PHY101 - Physics I"
  ];

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Notes</h1>
          <p className="text-gray-600">Organize and manage your academic notes across all courses.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">All Notes</h2>
                <button
                  onClick={() => {
                    setSelectedNote(null);
                    setIsEditing(false);
                    setNewNote({ title: "", content: "", course: "", tags: "" });
                  }}
                  className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
                >
                  + New Note
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNote(note);
                      setIsEditing(false);
                    }}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedNote?.id === note.id 
                        ? 'border-indigo-300 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{note.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{note.course}</p>
                    <p className="text-xs text-gray-500">{note.date}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{note.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Note Editor/Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {selectedNote && !isEditing ? (
                /* Note Viewer */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedNote.title}</h2>
                      <p className="text-sm text-gray-600">{selectedNote.course}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(selectedNote)}
                        className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedNote.content}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Created: {selectedNote.date}</p>
                  </div>
                </div>
              ) : (
                /* Note Editor */
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {isEditing ? 'Edit Note' : 'Create New Note'}
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter note title..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                      <select
                        value={newNote.course}
                        onChange={(e) => setNewNote({ ...newNote, course: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select a course...</option>
                        {courses.map((course) => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Write your notes here..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={newNote.tags}
                        onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., programming, variables, basics"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={isEditing ? handleUpdateNote : handleCreateNote}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                      >
                        {isEditing ? 'Update Note' : 'Create Note'}
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedNote(null);
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
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