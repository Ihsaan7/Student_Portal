'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

const CareerDevelopmentAdminPanel = ({ user }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [careerPathSettings, setCareerPathSettings] = useState({});
  const [showPathSettings, setShowPathSettings] = useState(false);
  const [formData, setFormData] = useState({
    career_path: 'ethical-hacking',
    timeline: 'start',
    instructions: '',
    steps: '',
    video_url: ''
  });

  const careerPaths = [
    { value: 'ethical-hacking', label: 'Ethical Hacking', icon: '🛡️', description: 'Advanced penetration testing and ethical hacking techniques' },
    { value: 'ai-ml', label: 'AI/ML', icon: '🤖', description: 'Artificial intelligence and machine learning specialization' },
    { value: 'cyber-security', label: 'Cyber Security', icon: '🔒', description: 'Complete roadmap from web development to cybersecurity expertise' }
  ];

  const timelines = [
    { value: 'start', label: 'Start (4 years)' },
    { value: 'middle', label: 'Middle (2 years)' },
    { value: 'end', label: 'End (1 year)' }
  ];

  useEffect(() => {
    loadContent();
    loadCareerPathSettings();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('career_development_content')
        .select('*')
        .order('career_path', { ascending: true })
        .order('timeline', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "career_development_content" does not exist')) {
          setError('Career development content table does not exist. Please run the database setup first.');
        } else {
          setError('Failed to load career development content: ' + error.message);
        }
        return;
      }

      setContent(data || []);
      setError('');
    } catch (err) {
      console.error('Error loading career content:', err);
      setError('Failed to load career development content');
    } finally {
      setLoading(false);
    }
  };

  const loadCareerPathSettings = async () => {
    try {
      // Try to load career path settings from a settings table or use localStorage as fallback
      const savedSettings = localStorage.getItem('career_path_settings');
      if (savedSettings) {
        setCareerPathSettings(JSON.parse(savedSettings));
      } else {
        // Default settings - only cyber-security is active by default
        const defaultSettings = {
          'cyber-security': { active: true, order: 1 },
          'ethical-hacking': { active: false, order: 2 },
          'ai-ml': { active: false, order: 3 }
        };
        setCareerPathSettings(defaultSettings);
        localStorage.setItem('career_path_settings', JSON.stringify(defaultSettings));
      }
    } catch (err) {
      console.error('Error loading career path settings:', err);
      // Fallback to default settings
      const defaultSettings = {
        'cyber-security': { active: true, order: 1 },
        'ethical-hacking': { active: false, order: 2 },
        'ai-ml': { active: false, order: 3 }
      };
      setCareerPathSettings(defaultSettings);
    }
  };

  const updateCareerPathStatus = async (pathValue, isActive) => {
    try {
      const updatedSettings = {
        ...careerPathSettings,
        [pathValue]: {
          ...careerPathSettings[pathValue],
          active: isActive
        }
      };
      
      setCareerPathSettings(updatedSettings);
      localStorage.setItem('career_path_settings', JSON.stringify(updatedSettings));
      
      setSuccess(`${careerPaths.find(p => p.value === pathValue)?.label} ${isActive ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating career path status:', err);
      setError('Failed to update career path status');
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
          .from('career_development_content')
          .update({
            ...formData,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        setSuccess('Career development content updated successfully!');
      } else {
        // Create new item
        const { error } = await supabase
          .from('career_development_content')
          .insert({
            ...formData,
            created_by: user.id,
            updated_by: user.id
          });

        if (error) throw error;
        setSuccess('Career development content created successfully!');
      }

      // Reset form and reload content
      setFormData({
        career_path: 'ethical-hacking',
        timeline: 'start',
        instructions: '',
        steps: '',
        video_url: ''
      });
      setEditingItem(null);
      setShowAddForm(false);
      loadContent();
    } catch (err) {
      console.error('Error saving career content:', err);
      setError('Failed to save career development content: ' + err.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      career_path: item.career_path,
      timeline: item.timeline,
      instructions: item.instructions || '',
      steps: item.steps || '',
      video_url: item.video_url || ''
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this career development content?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('career_development_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Career development content deleted successfully!');
      loadContent();
    } catch (err) {
      console.error('Error deleting career content:', err);
      setError('Failed to delete career development content: ' + err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      career_path: 'ethical-hacking',
      timeline: 'start',
      instructions: '',
      steps: '',
      video_url: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
    setError('');
    setSuccess('');
  };

  const getCareerPathLabel = (value) => {
    return careerPaths.find(cp => cp.value === value)?.label || value;
  };

  const getTimelineLabel = (value) => {
    return timelines.find(tl => tl.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-8 text-center border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
        <LoadingSpinner size="medium" variant="primary" />
        <span className="ml-2 text-muted-foreground">Loading career development content...</span>
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
              <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Career Development Hub
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">Craft personalized learning journeys for every career path</p>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3">
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                <span className="text-xs sm:text-sm font-medium text-primary">Total Paths: {content.length}</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                <span className="text-xs sm:text-sm font-medium text-primary">Active Timelines: 3</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowPathSettings(!showPathSettings)}
              className="bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium flex items-center cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Manage Paths</span>
              <span className="sm:hidden">Paths</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">{showAddForm ? 'Cancel' : 'Create Content'}</span>
              <span className="sm:hidden">{showAddForm ? 'Cancel' : 'Create'}</span>
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

      {/* Career Path Settings Panel */}
      {showPathSettings && (
        <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-6 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
          <div className="flex items-center mb-6">
            <div className="bg-accent/10 border border-accent/20 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Career Path Settings</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Control which career paths are available to students</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {careerPaths.map((path) => (
              <div key={path.value} className="bg-muted/30 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{path.icon}</span>
                    <div>
                      <h4 className="font-medium text-foreground">{path.label}</h4>
                      <p className="text-xs text-muted-foreground">{path.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Status: <span className={`font-medium ${careerPathSettings[path.value]?.active ? 'text-primary' : 'text-destructive'}`}>
                      {careerPathSettings[path.value]?.active ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                  
                  <button
                    onClick={() => updateCareerPathStatus(path.value, !careerPathSettings[path.value]?.active)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      careerPathSettings[path.value]?.active 
                        ? 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20' 
                        : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                    }`}
                  >
                    {careerPathSettings[path.value]?.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                
                {/* Content count for this path */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Content pieces: <span className="font-medium text-foreground">
                      {content.filter(c => c.career_path === path.value).length}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-primary mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">Frontend Integration</p>
                <p className="text-xs text-muted-foreground">
                  These settings control which career paths appear on the Progress page. 
                  Inactive paths will show "Coming Soon" messages to students.
                </p>
              </div>
            </div>
          </div>
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
                {editingItem ? 'Edit Career Content' : 'Create New Career Content'}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base">Design the perfect learning experience</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Career Path
                </label>
                <select
                  value={formData.career_path}
                  onChange={(e) => setFormData({ ...formData, career_path: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  required
                >
                  {careerPaths.map(cp => (
                    <option key={cp.value} value={cp.value}>{cp.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  required
                >
                  {timelines.map(tl => (
                    <option key={tl.value} value={tl.value}>{tl.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Instructions (HTML)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={6}
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                placeholder="Enter HTML content for instructions section..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Action Steps (HTML)
              </label>
              <textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                rows={6}
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                placeholder="Enter HTML content for action steps section..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Video URL
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {editingItem ? 'Update Content' : 'Create Content'}
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

      {/* Content List */}
      <div className="bg-card rounded-lg shadow-sm border border-primary/20 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex items-center">
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Content Library</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your career development content</p>
            </div>
          </div>
        </div>
        
        {content.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Content Yet</h4>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">Start building your career development library by adding your first content piece.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium cursor-pointer"
            >
              Create First Content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
            {content.map((item) => (
              <div key={item.id} className="bg-card rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/30">
                <div className="space-y-4">
                  {/* Header with badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {getCareerPathLabel(item.career_path)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                        {getTimelineLabel(item.timeline)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 cursor-pointer"
                        title="Edit content"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors border border-destructive/20 cursor-pointer"
                        title="Delete content"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Content sections */}
                  <div className="space-y-3">
                    {item.instructions && (
                      <div className="bg-primary/5 rounded-lg p-3 border-l-4 border-primary">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Instructions
                        </h4>
                        <div 
                          className="text-sm text-muted-foreground max-h-32 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: item.instructions }}
                        />
                      </div>
                    )}
                    
                    {item.steps && (
                      <div className="bg-accent/5 rounded-lg p-3 border-l-4 border-accent">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Action Steps
                        </h4>
                        <div 
                          className="text-sm text-muted-foreground max-h-32 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: item.steps }}
                        />
                      </div>
                    )}
                    
                    {item.video_url && (
                      <div className="bg-destructive/5 rounded-lg p-3 border-l-4 border-destructive">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Video Content
                        </h4>
                        <a 
                          href={item.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80 underline break-all transition-colors"
                        >
                          {item.video_url.length > 40 ? item.video_url.substring(0, 40) + '...' : item.video_url}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer with timestamps */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Created: {new Date(item.created_at).toLocaleDateString()}
                      {item.updated_at !== item.created_at && (
                        <span className="ml-2">• Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
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

export default CareerDevelopmentAdminPanel;