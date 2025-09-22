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
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="animate-pulse">
          <div className="h-6 rounded w-1/3 mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
          <div className="space-y-3">
            <div className="h-4 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
            <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
            <div className="h-4 rounded w-4/6" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
          </div>
          <div className="h-64 rounded mt-6" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!guidance) {
    return (
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>How to Attempt this Course</h2>
          <AdminCourseGuidanceManager 
            courseCode={courseCode}
            existingGuidance={null}
            onContentUpdated={handleContentUpdated}
          />
        </div>
        <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Course guidance will be available soon</p>
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>Check back later for detailed instructions on how to approach this course</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
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
          <h3 className="text-lg font-medium mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Course Guidelines:</h3>
          <div className="space-y-3">
            {guidance.guidance_points.map((point, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--card-foreground))' }}>{point.point || point}</p>
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
            <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>Course Introduction Video</h3>
            {guidance.duration && (
              <span className="text-sm px-2 py-1 rounded" style={{ color: 'hsl(var(--muted-foreground))', backgroundColor: 'hsl(var(--muted))' }}>
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
                className="inline-flex items-center text-sm font-medium transition-colors"
                style={{ color: 'hsl(var(--primary))' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
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
          
          <div className="text-center py-8 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Course Introduction Video</p>
            <a
              href={guidance.main_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Video
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Course introduction video will be available soon</p>
        </div>
      )}
    </div>
  );
}