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
    if (!propCourseCode) {
      fetchCourses();
    }
  }, [propCourseCode]);

  useEffect(() => {
    if (selectedCourseCode) {
      fetchGuidance();
    }
  }, [selectedCourseCode]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('enrolled_courses')
        .select('course_code, course_name')
        .order('course_code');

      if (error) throw error;
      
      // Remove duplicates
      const uniqueCourses = data.reduce((acc, course) => {
        if (!acc.find(c => c.course_code === course.course_code)) {
          acc.push(course);
        }
        return acc;
      }, []);
      
      setCourses(uniqueCourses);
      if (uniqueCourses.length > 0 && !selectedCourseCode) {
        setSelectedCourseCode(uniqueCourses[0].course_code);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      showToast('Failed to load courses', 'error');
    }
  };

  const fetchGuidance = async () => {
    if (!selectedCourseCode) {
      console.log('No course selected, skipping guidance fetch');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_guidance')
        .select('*')
        .eq('course_code', selectedCourseCode)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setGuidance(data);
        setFormData({
          guidance_points: data.guidance_points || [''],
          main_video_url: data.main_video_url || '',
          main_video_title: data.main_video_title || 'How to Attempt this Course',
          duration: data.duration || ''
        });
      }
    } catch (error) {
      console.error('Error fetching guidance:', error);
      showToast('Failed to load course guidance', 'error');
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

      let result;
      if (guidance) {
        // Update existing guidance
        result = await supabase
          .from('course_guidance')
          .update(guidanceData)
          .eq('id', guidance.id)
          .select()
          .single();
      } else {
        // Create new guidance
        const { data: { user } } = await supabase.auth.getUser();
        guidanceData.created_by = user?.id;
        
        result = await supabase
          .from('course_guidance')
          .insert(guidanceData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setGuidance(result.data);
      showToast('Course guidance saved successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving guidance:', error);
      showToast('Failed to save course guidance', 'error');
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Course Guidance Management{selectedCourseCode ? ` - ${selectedCourseCode}` : ''}
          </h3>
          <span className="text-sm text-gray-500">
            {guidance ? 'Last updated: ' + new Date(guidance.updated_at).toLocaleDateString() : 'No guidance set'}
          </span>
        </div>

        {/* Course Selector */}
        {!propCourseCode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div className="space-y-6">
          {/* Main Video Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Video Title
            </label>
            <input
              type="text"
              value={formData.main_video_title}
              onChange={(e) => setFormData(prev => ({ ...prev, main_video_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How to Attempt this Course"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Video URL (YouTube)
            </label>
            <input
              type="url"
              value={formData.main_video_url}
              onChange={(e) => setFormData(prev => ({ ...prev, main_video_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Duration (MM:SS or HH:MM:SS)
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15:30"
            />
          </div>

          {/* Guidance Points Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Guidance Points
              </label>
              <button
                onClick={addGuidancePoint}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                + Add Point
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.guidance_points.map((point, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 min-w-[60px]">
                    Point {index + 1}:
                  </span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updateGuidancePoint(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter guidance point ${index + 1}`}
                  />
                  {formData.guidance_points.length > 1 && (
                    <button
                      onClick={() => removeGuidancePoint(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving || !selectedCourseCode}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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