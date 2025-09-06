'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import LectureSystem from '../../components/LectureSystem';
import CourseGuidanceSection from '../../components/CourseGuidanceSection';

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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout currentPage="/course">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/home')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
            <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
            <p className="text-gray-600 mt-2">The requested course could not be found.</p>
            <button
              onClick={() => router.push('/home')}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                  {course.course_code}
                </span>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {course.credits} Credits
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.course_name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📚 {course.semester}</span>
                <span>🎓 {course.programme}</span>
                <span>📅 Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Course Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* How to Attempt this Course Section */}
            <CourseGuidanceSection courseCode={courseCode} />

            {/* Shorter Course Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Course Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">Course Information</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li><strong>Code:</strong> {course.course_code}</li>
                    <li><strong>Credits:</strong> {course.credits}</li>
                    <li><strong>Semester:</strong> {course.semester}</li>
                    <li><strong>Programme:</strong> {course.programme}</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">Quick Stats</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li><strong>Enrolled:</strong> {new Date(course.enrolled_at).toLocaleDateString()}</li>
                    <li><strong>Status:</strong> <span className="text-green-600">Active</span></li>
                    <li><strong>Progress:</strong> In Progress</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Lecture System */}
            <LectureSystem courseCode={courseCode} user={user} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-sm font-medium text-gray-900">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-600">Assignments</span>
                  <span className="text-sm font-medium text-gray-900">0/0</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lectures Watched</span>
                  <span className="text-sm font-medium text-gray-900">0/0</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="text-sm font-medium text-gray-900">Today</span>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
              <div className="text-center text-gray-500 py-4">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No upcoming deadlines</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}