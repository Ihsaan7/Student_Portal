'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import LectureSystem from '../../components/LectureSystem';
import CourseGuidanceSection from '../../components/CourseGuidanceSection';
import AIStudyAssistant from '../../components/AIStudyAssistant';

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { courseCode } = params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [router]);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!user || !courseCode) return;

      try {
        setLoading(true);
        
        // Fetch course details from enrolled_courses table
        const { data: courseData, error: courseError } = await supabase
          .from('enrolled_courses')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_code', courseCode)
          .single();

        if (courseError) {
          if (courseError.code === 'PGRST116') {
            setError('Course not found or you are not enrolled in this course.');
          } else {
            setError('Failed to load course details.');
          }
          return;
        }

        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [user, courseCode]);

  if (loading) {
    return (
      <DashboardLayout currentPage="/course">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: 'hsl(var(--primary))' }}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout currentPage="/course">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-lg border-2 p-6" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', borderColor: 'hsl(var(--destructive))' }}>
            <div className="flex items-center">
              <div className="mr-3" style={{ color: 'hsl(var(--destructive))' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--destructive))' }}>Error</h3>
                <p style={{ color: 'hsl(var(--destructive))' }}>{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/home')}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout currentPage="/course">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Course not found</h2>
            <p className="mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>The requested course could not be found.</p>
            <button
              onClick={() => router.push('/home')}
              className="mt-4 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/course">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="rounded-xl shadow-sm border-2 p-6 mb-8" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  {course.course_code}
                </span>
                <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                  {course.credits} Credits
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-3" style={{ color: 'hsl(var(--card-foreground))' }}>{course.course_name}</h1>
              <div className="flex items-center space-x-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <span>📚 {course.semester}</span>
                <span>🎓 {course.programme}</span>
                <span>📅 Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(var(--muted) / 0.8)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(var(--muted))'}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Course Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* How to Attempt this Course Section */}
            <CourseGuidanceSection courseCode={courseCode} />

            {/* AI Study Assistant - Now in main content area */}
            <AIStudyAssistant courseCode={courseCode} user={user} />

            {/* Lecture System */}
            <LectureSystem courseCode={courseCode} user={user} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Course Overview - Now in sidebar */}
            <div className="rounded-xl shadow-sm border-2 p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Course Overview</h2>
              <div className="space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                  <h3 className="font-medium mb-2 text-sm" style={{ color: 'hsl(var(--card-foreground))' }}>Course Information</h3>
                  <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <li><strong>Code:</strong> {course.course_code}</li>
                    <li><strong>Credits:</strong> {course.credits}</li>
                    <li><strong>Semester:</strong> {course.semester}</li>
                    <li><strong>Programme:</strong> {course.programme}</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                  <h3 className="font-medium mb-2 text-sm" style={{ color: 'hsl(var(--card-foreground))' }}>Quick Stats</h3>
                  <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <li><strong>Enrolled:</strong> {new Date(course.enrolled_at).toLocaleDateString()}</li>
                    <li><strong>Status:</strong> <span style={{ color: 'hsl(var(--primary))' }}>Active</span></li>
                    <li><strong>Progress:</strong> In Progress</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}