'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

const VUTipsAdminPanel = ({ user }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_id: '',
    order_index: 1,
    is_active: true
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('vu_tips_sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading VU Tips sections:', error);
        setError('Failed to load VU Tips sections: ' + error.message);
        return;
      }

      setSections(data || []);
      setError('');
    } catch (err) {
      console.error('Error loading VU Tips sections:', err);
      setError('Failed to load VU Tips sections');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('vu_tips_sections')
          .update({
            ...formData,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        setSuccess('VU Tips section updated successfully!');
      } else {
        // Create new item
        const { error } = await supabase
          .from('vu_tips_sections')
          .insert({
            ...formData,
            created_by: user.id,
            updated_by: user.id
          });

        if (error) throw error;
        setSuccess('VU Tips section created successfully!');
      }

      // Reset form and reload sections
      setFormData({
        title: '',
        description: '',
        video_id: '',
        order_index: sections.length + 1,
        is_active: true
      });
      setEditingItem(null);
      setShowAddForm(false);
      loadSections();
    } catch (err) {
      console.error('Error saving VU Tips section:', err);
      setError('Failed to save VU Tips section: ' + err.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      video_id: item.video_id || '',
      order_index: item.order_index,
      is_active: item.is_active
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this VU Tips section?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vu_tips_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('VU Tips section deleted successfully!');
      loadSections();
    } catch (err) {
      console.error('Error deleting VU Tips section:', err);
      setError('Failed to delete VU Tips section: ' + err.message);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('vu_tips_sections')
        .update({ 
          is_active: !currentStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setSuccess(`Section ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadSections();
    } catch (err) {
      console.error('Error toggling section status:', err);
      setError('Failed to update section status: ' + err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      video_id: '',
      order_index: sections.length + 1,
      is_active: true
    });
    setEditingItem(null);
    setShowAddForm(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-8 text-center border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
        <LoadingSpinner size="medium" variant="primary" />
        <span className="ml-2 text-muted-foreground">Loading VU Tips sections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-6 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 flex items-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              VU Tips Management
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">Manage video tips and guidance for VU students</p>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3">
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                <span className="text-xs sm:text-sm font-medium text-primary">Total Sections: {sections.length}</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                <span className="text-xs sm:text-sm font-medium text-primary">Active: {sections.filter(s => s.is_active).length}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">{showAddForm ? 'Cancel' : 'Add Section'}</span>
              <span className="sm:hidden">{showAddForm ? 'Cancel' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>



      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-6 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
          <div className="flex items-center mb-6">
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {editingItem ? 'Edit VU Tips Section' : 'Create New VU Tips Section'}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base">Add helpful video content for VU students</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="e.g., Study Techniques"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
                  </svg>
                  Order Index
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                placeholder="Brief description of what this section covers..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Google Drive Video ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.video_id}
                  onChange={(e) => setFormData({ ...formData, video_id: e.target.value })}
                  className="flex-1 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74mHxYnpSdI"
                />
                {formData.video_id && (
                  <button
                    type="button"
                    onClick={() => {
                      const testUrl = `https://drive.google.com/file/d/${formData.video_id}/preview`;
                      window.open(testUrl, 'TestVideo', 'width=800,height=600');
                    }}
                    className="px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                  >
                    Test Video
                  </button>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p><strong>Steps to get Video ID:</strong></p>
                <p>1. Upload video to Google Drive</p>
                <p>2. Right-click → Share → <strong>"Anyone with the link"</strong> → Viewer</p>
                <p>3. Copy the file ID from URL: https://drive.google.com/file/d/<strong>FILE_ID</strong>/view</p>
                <p>4. Paste only the FILE_ID here (not the full URL)</p>
                <p>5. Click "Test Video" to verify it works before saving</p>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                Active (visible to students)
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {editingItem ? 'Update Section' : 'Create Section'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors font-medium flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sections List */}
      <div className="bg-card rounded-lg shadow-sm border border-primary/20 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex items-center">
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">VU Tips Sections</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Manage all VU Tips video sections</p>
            </div>
          </div>
        </div>
        
        {sections.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="text-4xl mb-4">💡</div>
            <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No VU Tips Sections Yet</h4>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">Start building your VU Tips library by adding your first section.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium cursor-pointer"
            >
              Create First Section
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
            {sections.map((section) => (
              <div key={section.id} className="bg-card rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/30">
                <div className="space-y-4">
                  {/* Header with badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        Order: {section.order_index}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                        section.is_active 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {section.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleActive(section.id, section.is_active)}
                        className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                          section.is_active 
                            ? 'text-destructive hover:text-destructive/80 hover:bg-destructive/10 border-destructive/20' 
                            : 'text-primary hover:text-primary/80 hover:bg-primary/10 border-primary/20'
                        }`}
                        title={section.is_active ? 'Deactivate section' : 'Activate section'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.is_active ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(section)}
                        className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 cursor-pointer"
                        title="Edit section"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors border border-destructive/20 cursor-pointer"
                        title="Delete section"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{section.title}</h4>
                      {section.description && (
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      )}
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Video Status:</span>
                        <span className={`text-xs font-medium ${section.video_id ? 'text-primary' : 'text-muted-foreground'}`}>
                          {section.video_id ? '✅ Video Available' : '⏳ No Video'}
                        </span>
                      </div>
                      {section.video_id && (
                        <div className="mt-2 text-xs text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded">
                          ID: {section.video_id.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VUTipsAdminPanel;