"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { isAdminMode } from "./AdminOnlyButton";
import { ConfirmationDialog } from "./AdminControlPanel";

export default function CourseAdminPanel({ courseId, courseName, onUpdate }) {
  const [adminMode, setAdminMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [files, setFiles] = useState([]);
  const [announcementsError, setAnnouncementsError] = useState(null);

  useEffect(() => {
    setAdminMode(isAdminMode());
    if (isAdminMode()) {
      loadCourseFiles();
      loadAnnouncements();
    }
  }, [courseId]);

  const loadCourseFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('course-files')
        .list(`course-${courseId}`);
      
      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading course files:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "announcements" does not exist')) {
          setAnnouncementsError('table_missing');
          console.warn('Announcements table does not exist. Please run database setup.');
          return;
        } else {
          setAnnouncementsError('general_error');
          console.error('Error loading announcements:', error);
          return;
        }
      }
      setAnnouncements(data || []);
      setAnnouncementsError(null);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncementsError('general_error');
    }
  };

  const handleEditCourse = () => {
    setEditData({
      name: courseName || '',
      description: '',
      status: 'active'
    });
    setIsEditing(true);
  };

  const handleSaveCourse = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .update(editData)
        .eq('id', courseId);
      
      if (error) throw error;
      
      console.log('Admin updated course:', courseId, editData);
      onUpdate?.();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          course_id: courseId,
          title: 'Admin Announcement',
          content: newAnnouncement,
          urgent: true,
          created_by: 'admin'
        });
      
      if (error) throw error;
      
      console.log('Admin created announcement for course:', courseId);
      setNewAnnouncement('');
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleDeleteFile = (fileName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Course File",
      message: `This will permanently delete the file "${fileName}". Continue?`,
      type: "danger",
      onConfirm: async () => {
        try {
          const { error } = await supabase.storage
            .from('course-files')
            .remove([`course-${courseId}/${fileName}`]);
          
          if (error) throw error;
          
          console.log('Admin deleted course file:', fileName);
          loadCourseFiles();
          setConfirmDialog({ isOpen: false });
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }
    });
  };

  const handleDeleteAnnouncement = (announcementId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Announcement",
      message: "This will permanently delete this announcement. Continue?",
      type: "danger",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', announcementId);
          
          if (error) throw error;
          
          console.log('Admin deleted announcement:', announcementId);
          loadAnnouncements();
          setConfirmDialog({ isOpen: false });
        } catch (error) {
          console.error('Error deleting announcement:', error);
        }
      }
    });
  };

  if (!adminMode) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-indigo-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Course Management (Admin Only)
      </h3>
      
      {/* Course Editing */}
      {isEditing ? (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Edit Course Details</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Course Name"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="w-full p-2 border rounded-md text-sm"
            />
            <textarea
              placeholder="Course Description"
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              className="w-full p-2 border rounded-md text-sm h-20"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveCourse}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <button
            onClick={handleEditCourse}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            Edit Course Details
          </button>
        </div>
      )}
      
      {/* Announcement Creation */}
      {announcementsError === 'table_missing' ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">⚠️ Announcements System Not Set Up</h4>
          <p className="text-red-700 text-sm mb-3">
            The announcements table doesn't exist in your database. This needs to be set up before you can create announcements.
          </p>
          <a
            href="/admin/setup-announcements"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
          >
            🔧 Setup Announcements System
          </a>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Create Urgent Announcement</h4>
          <div className="flex gap-2">
            <textarea
              placeholder="Enter announcement message..."
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              className="flex-1 p-2 border rounded-md text-sm h-20"
            />
            <button
              onClick={handleCreateAnnouncement}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition text-sm self-start"
            >
              Post
            </button>
          </div>
        </div>
      )}
      
      {/* Recent Announcements */}
      {announcementsError !== 'table_missing' && announcements.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Recent Announcements</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {announcements.slice(0, 3).map((announcement) => (
              <div key={announcement.id} className="flex items-start justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{announcement.content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* File Management */}
      <div className="p-3 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">Course Files Management</h4>
        {files.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {files.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    Size: {(file.metadata?.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.name)}
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No files found for this course.</p>
        )}
      </div>
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
}