"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Toast from './Toast';

export default function AdminCourseGuidancePanel({ courseCode: propCourseCode }) {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [courses, setCourses] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState(propCourseCode || '');
  const [formData, setFormData] = useState({
    guidance_points: [''],
    main_video_url: '',
    main_video_title: 'How to Attempt this Course',
    duration: ''
  });

  useEffect(() => {
    // Test database connection on component mount
    testDatabaseConnection();
    
    if (!propCourseCode) {
      fetchCourses();
    }
  }, [propCourseCode]);

  useEffect(() => {
    if (selectedCourseCode) {
      fetchGuidance();
    }
  }, [selectedCourseCode]);

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      
      // Test 1: Check if we can connect to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Auth test - User:', user ? 'authenticated' : 'not authenticated');
      
      // Test 2: Check if the course_guidance table exists
      const { data: tableTest, error: tableError } = await supabase
        .from('course_guidance')
        .select('count')
        .limit(1);
      
      console.log('Table test - course_guidance exists:', !tableError);
      if (tableError) {
        console.log('Table error:', tableError);
      }
      
      // Test 3: Check if the enrolled_courses table exists
      const { data: coursesTableTest, error: coursesTableError } = await supabase
        .from('enrolled_courses')
        .select('count')
        .limit(1);
      
      console.log('Table test - enrolled_courses exists:', !coursesTableError);
      if (coursesTableError) {
        console.log('Courses table error:', coursesTableError);
      }
      
    } catch (error) {
      console.error('Database connection test failed:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping courses fetch');
        return;
      }
      
      console.log('Fetching courses...');
      
      const { data, error } = await supabase
        .from('enrolled_courses')
        .select('course_code, course_name')
        .order('course_code');

      console.log('Courses fetch result:', { data, error });

      if (error) {
        if (error.code === '42P01') {
          console.error('Table enrolled_courses does not exist. Please run the database setup script.');
          showToast('Database table not found. Please contact admin to set up the database.', 'error');
          return;
        }
        throw error;
      }
      
      // Remove duplicates
      const uniqueCourses = data?.reduce((acc, course) => {
        if (!acc.find(c => c.course_code === course.course_code)) {
          acc.push(course);
        }
        return acc;
      }, []) || [];
      
      console.log('Unique courses found:', uniqueCourses.length);
      setCourses(uniqueCourses);
      
      if (uniqueCourses.length > 0 && !selectedCourseCode) {
        setSelectedCourseCode(uniqueCourses[0].course_code);
      }
    } catch (error) {
      console.error('Error fetching courses:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        showToast('Database table not found. Please contact admin to set up the database.', 'error');
      } else {
        showToast(`Failed to load courses: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const fetchGuidance = async () => {
    if (!selectedCourseCode) {
      console.log('No course selected, skipping guidance fetch');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping guidance fetch');
        setLoading(false);
        return;
      }
      
      console.log('Fetching guidance for course:', selectedCourseCode);
      
      // First check if the table exists by trying to select from it
      const { data, error } = await supabase
        .from('course_guidance')
        .select('*')
        .eq('course_code', selectedCourseCode)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

      console.log('Guidance fetch result:', { data, error });

      if (error) {
        // Handle specific error cases
        if (error.code === '42P01') {
          console.error('Table course_guidance does not exist. Please run the database setup script.');
          showToast('Database table not found. Please contact admin to set up the database.', 'error');
          return;
        } else if (error.code === 'PGRST116') {
          // No rows found - this is fine, just means no guidance exists yet
          console.log('No guidance found for course:', selectedCourseCode);
          setGuidance(null);
          setFormData({
            guidance_points: [''],
            main_video_url: '',
            main_video_title: 'How to Attempt this Course',
            duration: ''
          });
          return;
        } else {
          throw error;
        }
      }

      if (data) {
        console.log('Guidance data loaded:', data);
        setGuidance(data);
        setFormData({
          guidance_points: data.guidance_points || [''],
          main_video_url: data.main_video_url || '',
          main_video_title: data.main_video_title || 'How to Attempt this Course',
          duration: data.duration || ''
        });
      } else {
        // No guidance found, reset to defaults
        console.log('No guidance data found, using defaults');
        setGuidance(null);
        setFormData({
          guidance_points: [''],
          main_video_url: '',
          main_video_title: 'How to Attempt this Course',
          duration: ''
        });
      }
    } catch (error) {
      console.error('Error fetching guidance:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      
      // More specific error messages
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        showToast('Database table not found. Please contact admin to set up the database.', 'error');
      } else if (error.message?.includes('permission') || error.message?.includes('not authorized')) {
        showToast('Permission denied. Please check your authentication.', 'error');
      } else {
        showToast(`Failed to load course guidance: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const addGuidancePoint = () => {
    setFormData(prev => ({
      ...prev,
      guidance_points: [...prev.guidance_points, '']
    }));
  };

  const removeGuidancePoint = (index) => {
    if (formData.guidance_points.length > 1) {
      setFormData(prev => ({
        ...prev,
        guidance_points: prev.guidance_points.filter((_, i) => i !== index)
      }));
    }
  };

  const updateGuidancePoint = (index, value) => {
    setFormData(prev => ({
      ...prev,
      guidance_points: prev.guidance_points.map((point, i) => 
        i === index ? value : point
      )
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!selectedCourseCode) {
        showToast('Please select a course', 'error');
        return;
      }
      
      // Filter out empty guidance points
      const filteredPoints = formData.guidance_points.filter(point => point.trim() !== '');
      
      if (filteredPoints.length === 0) {
        showToast('Please add at least one guidance point', 'error');
        return;
      }

      const youtube_video_id = extractYouTubeVideoId(formData.main_video_url);
      
      const guidanceData = {
        course_code: selectedCourseCode,
        guidance_points: filteredPoints,
        main_video_url: formData.main_video_url,
        main_video_title: formData.main_video_title,
        youtube_video_id,
        duration: formData.duration,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      console.log('Saving guidance data:', guidanceData);

      let result;
      if (guidance) {
        // Update existing guidance
        console.log('Updating existing guidance with ID:', guidance.id);
        result = await supabase
          .from('course_guidance')
          .update(guidanceData)
          .eq('id', guidance.id)
          .select()
          .single();
      } else {
        // Create new guidance
        console.log('Creating new guidance');
        const { data: { user } } = await supabase.auth.getUser();
        guidanceData.created_by = user?.id;
        guidanceData.created_at = new Date().toISOString();
        
        result = await supabase
          .from('course_guidance')
          .insert(guidanceData)
          .select()
          .single();
      }

      console.log('Save result:', result);

      if (result.error) {
        throw result.error;
      }

      setGuidance(result.data);
      showToast('Course guidance saved successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving guidance:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      
      // More specific error messages
      if (error.code === '42P01') {
        showToast('Database table not found. Please contact admin to set up the database.', 'error');
      } else if (error.code === '23505') {
        showToast('A guidance entry already exists for this course. Please refresh the page.', 'error');
      } else if (error.message?.includes('permission') || error.message?.includes('not authorized')) {
        showToast('Permission denied. Please check your authentication.', 'error');
      } else {
        showToast(`Failed to save course guidance: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  if (loading) {
    return (
      <div className="rounded-lg shadow-sm border p-4 sm:p-6 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="animate-pulse">
          <div className="h-6 rounded w-1/3 mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
          <div className="space-y-3">
            <div className="h-4 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
            <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
            <div className="h-4 rounded w-4/6" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg shadow-sm border p-4 sm:p-6 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold break-words" style={{ color: 'hsl(var(--card-foreground))' }}>
            Course Guidance Management{selectedCourseCode ? ` - ${selectedCourseCode}` : ''}
          </h3>
          <span className="text-xs sm:text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {guidance ? 'Last updated: ' + new Date(guidance.updated_at).toLocaleDateString() : 'No guidance set'}
          </span>
        </div>

        {/* Course Selector */}
        {!propCourseCode && (
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
              Select Course
            </label>
            <select
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                '--tw-ring-color': 'hsl(var(--primary))'
              }}
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.course_code} value={course.course_code}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Main Video Section */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
              Main Video Title
            </label>
            <input
              type="text"
              value={formData.main_video_title}
              onChange={(e) => setFormData(prev => ({ ...prev, main_video_title: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                '--tw-ring-color': 'hsl(var(--primary))'
              }}
              placeholder="How to Attempt this Course"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
              Main Video URL (YouTube)
            </label>
            <input
              type="url"
              value={formData.main_video_url}
              onChange={(e) => setFormData(prev => ({ ...prev, main_video_url: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                '--tw-ring-color': 'hsl(var(--primary))'
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
              Video Duration (MM:SS or HH:MM:SS)
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                '--tw-ring-color': 'hsl(var(--primary))'
              }}
              placeholder="15:30"
            />
          </div>

          {/* Guidance Points Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
              <label className="block text-xs sm:text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
                Guidance Points
              </label>
              <button
                onClick={addGuidancePoint}
                className="px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                + Add Point
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.guidance_points.map((point, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <span className="text-xs sm:text-sm font-medium sm:min-w-[80px] flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Point {index + 1}:
                  </span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updateGuidancePoint(index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      '--tw-ring-color': 'hsl(var(--primary))'
                    }}
                    placeholder={`Enter guidance point ${index + 1}`}
                  />
                  {formData.guidance_points.length > 1 && (
                    <button
                      onClick={() => removeGuidancePoint(index)}
                      className="p-1.5 rounded transition-colors flex-shrink-0 self-end sm:self-center"
                      style={{ color: 'hsl(var(--destructive))' }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <button
              onClick={handleSave}
              disabled={saving || !selectedCourseCode}
              className="px-4 sm:px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium w-full sm:w-auto"
              style={{
                backgroundColor: saving || !selectedCourseCode ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                color: saving || !selectedCourseCode ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))'
              }}
              onMouseEnter={(e) => {
                if (!saving && selectedCourseCode) {
                  e.target.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && selectedCourseCode) {
                  e.target.style.opacity = '1';
                }
              }}
            >
              {saving ? 'Saving...' : 'Save Guidance'}
            </button>
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </>
  );
}