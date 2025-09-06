"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminCourseGuidanceManager from './AdminCourseGuidanceManager';

export default function CourseGuidanceSection({ courseCode }) {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGuidance();
  }, [courseCode]);

  const fetchGuidance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('course_guidance')
        .select('*')
        .eq('course_code', courseCode)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setGuidance(data);
    } catch (err) {
      console.error('Error fetching guidance:', err);
      setError('Failed to load course guidance');
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdated = (updatedGuidance) => {
    setGuidance(updatedGuidance);
  };

  const getYouTubeEmbedUrl = (videoId) => {
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
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
          <div className="h-64 bg-gray-200 rounded mt-6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!guidance) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">How to Attempt this Course</h2>
          <AdminCourseGuidanceManager 
            courseCode={courseCode}
            existingGuidance={null}
            onContentUpdated={handleContentUpdated}
          />
        </div>
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Course guidance will be available soon</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for detailed instructions on how to approach this course</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {guidance.main_video_title || 'How to Attempt this Course'}
        </h2>
        <AdminCourseGuidanceManager 
          courseCode={courseCode}
          existingGuidance={guidance}
          onContentUpdated={handleContentUpdated}
        />
      </div>

      {/* Guidance Points */}
      {guidance.guidance_points && guidance.guidance_points.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Course Guidelines:</h3>
          <div className="space-y-3">
            {guidance.guidance_points.map((point, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{point.point || point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Video Section */}
      {guidance.youtube_video_id ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Course Introduction Video</h3>
            {guidance.duration && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Duration: {guidance.duration}
              </span>
            )}
          </div>
          
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={getYouTubeEmbedUrl(guidance.youtube_video_id)}
              title={guidance.main_video_title || 'How to Attempt this Course'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          
          {guidance.main_video_url && (
            <div className="text-center">
              <a
                href={guidance.main_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Watch on YouTube
              </a>
            </div>
          )}
        </div>
      ) : guidance.main_video_url ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Course Introduction Video</h3>
            {guidance.duration && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Duration: {guidance.duration}
              </span>
            )}
          </div>
          
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 mb-4">Course Introduction Video</p>
            <a
              href={guidance.main_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Video
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-sm">Course introduction video will be available soon</p>
        </div>
      )}
    </div>
  );
}