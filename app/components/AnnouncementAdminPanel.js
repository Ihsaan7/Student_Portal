"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Toast from './Toast';

export default function AnnouncementAdminPanel() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    video_url: '',
    is_active: true
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast('Error fetching announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let videoUrl = formData.video_url;
      let videoFileName = null;

      // Upload video file if provided
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(`videos/${fileName}`, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('announcements')
          .getPublicUrl(`videos/${fileName}`);

        videoUrl = publicUrl;
        videoFileName = fileName;
      }

      const announcementData = {
        title: formData.title,
        content: formData.content,
        video_url: videoUrl,
        video_file_name: videoFileName,
        is_active: formData.is_active
      };

      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            ...announcementData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        showToast('Announcement updated successfully!');
      } else {
        // Check if we already have 5 announcements before creating a new one
        const { count, error: countError } = await supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        if (count >= 5) {
          showToast('Cannot create more than 5 announcements. Please delete an existing announcement first.', 'error');
          setUploading(false);
          return;
        }

        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert([announcementData]);

        if (error) throw error;
        showToast('Announcement created successfully!');
      }

      // Reset form and refresh data
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      showToast('Error saving announcement', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      video_url: announcement.video_url || '',
      is_active: announcement.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast('Error deleting announcement', 'error');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showToast(`Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement status:', error);
      showToast('Error updating announcement status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      video_url: '',
      is_active: true
    });
    setVideoFile(null);
    setEditingAnnouncement(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-8 text-center border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-6 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Manage Announcements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
        >
          {showForm ? 'Cancel' : 'Add New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="bg-muted/30 rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Video URL (optional)
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="https://example.com/video.mp4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Or Upload Video File
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2 accent-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                Active (visible to users)
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {uploading ? 'Saving...' : (editingAnnouncement ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors cursor-pointer border border-border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📢</div>
            <p className="text-muted-foreground">No announcements found.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                <h3 className="text-base sm:text-lg font-medium text-foreground">{announcement.title}</h3>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-md font-medium border ${
                    announcement.is_active 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {announcement.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">{announcement.content}</p>
              
              {announcement.video_url && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">Video: 
                    <a href={announcement.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 ml-1 transition-colors">
                      View Video
                    </a>
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-muted-foreground gap-2">
                <span>Created: {new Date(announcement.created_at).toLocaleDateString()}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(announcement.id, announcement.is_active)}
                    className="text-accent hover:text-accent/80 transition-colors cursor-pointer"
                  >
                    {announcement.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
}