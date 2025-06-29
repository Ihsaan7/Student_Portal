"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardLayout from "../components/DashboardLayout";

// Helper function to shorten programme names
const shortenProgramme = (programme) => {
  if (!programme) return 'Not set';
  
  const programmeMap = {
    'Bachelor of Science in Software Engineering (BSSE)': 'BS in Software Engineering',
    'Bachelor of Science in Computer Science (BSCS)': 'BS in Computer Science',
    'Bachelor of Business Administration (BBA)': 'BBA',
    'Bachelor of Science in Information Technology (BSIT)': 'BS in IT',
    'Bachelor of Science in Data Science (BSDS)': 'BS in Data Science',
    'Bachelor of Science in Artificial Intelligence (BSAI)': 'BS in AI',
    'Bachelor of Commerce (B.Com)': 'B.Com',
    'Bachelor of Arts (BA)': 'BA',
    'Bachelor of Science (BS)': 'BS',
    'Bachelor of Education (B.Ed)': 'B.Ed',
    'Bachelor of Library and Information Science (BLIS)': 'BLIS',
    'Bachelor of Mass Communication (BMC)': 'BMC',
    'Bachelor of Public Administration (BPA)': 'BPA',
    'Bachelor of Islamic Studies (BIS)': 'BIS',
    'Bachelor of Economics (BE)': 'BE',
    'Bachelor of Mathematics (BM)': 'BM',
    'Bachelor of Statistics (BS)': 'BS',
    'Bachelor of Psychology (BP)': 'BP',
    'Bachelor of Sociology (BS)': 'BS',
    'Bachelor of English (BA English)': 'BA English',
    'Bachelor of Urdu (BA Urdu)': 'BA Urdu',
    'Bachelor of Arabic (BA Arabic)': 'BA Arabic',
    'Bachelor of Persian (BA Persian)': 'BA Persian',
    'Bachelor of History (BA History)': 'BA History',
    'Bachelor of Political Science (BA Political Science)': 'BA Political Science',
    'Bachelor of International Relations (BA IR)': 'BA IR',
    'Bachelor of Media Studies (BMS)': 'BMS',
    'Bachelor of Fine Arts (BFA)': 'BFA',
    'Bachelor of Design (BD)': 'BD'
  };
  
  return programmeMap[programme] || programme;
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Get user profile data
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setUserProfile(profile);
      }

      // Get enrolled courses
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrolled_courses')
        .select('*')
        .eq('user_id', user.id);

      if (enrollmentError) {
        console.error('Error fetching enrollments:', enrollmentError);
        if (enrollmentError.code === '42P01') {
          console.log('Table does not exist yet. Please run the SQL setup script.');
        }
        setEnrolledCourses([]);
      } else {
        setEnrolledCourses(enrollments || []);
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleUnenrollClick = (course) => {
    setCourseToUnenroll(course);
    setShowUnenrollModal(true);
  };

  const handleUnenrollConfirm = async () => {
    if (!courseToUnenroll) return;

    try {
      const { error } = await supabase
        .from('enrolled_courses')
        .delete()
        .eq('id', courseToUnenroll.id);

      if (error) {
        console.error('Error unenrolling from course:', error);
        alert('Failed to unenroll from course. Please try again.');
      } else {
        // Remove the course from the local state
        setEnrolledCourses(prev => prev.filter(course => course.id !== courseToUnenroll.id));
        setShowUnenrollModal(false);
        setCourseToUnenroll(null);
      }
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      alert('Failed to unenroll from course. Please try again.');
    }
  };

  const handleUnenrollCancel = () => {
    setShowUnenrollModal(false);
    setCourseToUnenroll(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading Home...</div>
          <div className="text-white/70 text-sm mt-2">Please wait while we fetch your data</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout currentPage="/home">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-600">
                {userProfile?.name?.charAt(0) || user?.email?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                Welcome back, {userProfile?.name || 'Student'}!
              </h2>
              <p className="text-gray-600 text-sm md:text-base">{user?.email}</p>
              {userProfile?.programme && (
                <p className="text-sm text-indigo-600 font-medium mt-1">
                  {shortenProgramme(userProfile.programme)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Current Semester Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Semester</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm md:text-base">Programme:</span>
                <span className="font-medium text-gray-900 text-sm md:text-base">{shortenProgramme(userProfile?.programme)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm md:text-base">Semester:</span>
                <span className="font-medium text-gray-900 text-sm md:text-base">Semester 1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm md:text-base">Enrolled Courses:</span>
                <span className="font-medium text-gray-900 text-sm md:text-base">{enrolledCourses.length}</span>
              </div>
            </div>
            <div className="mt-4">
              <a href="/course-selection" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Enroll in Courses
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-indigo-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Complete Course Enrollment</p>
                  <p className="text-xs text-gray-600">Select and enroll in your courses for this semester</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-indigo-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Check Your Schedule</p>
                  <p className="text-xs text-gray-600">View your class timetable and important dates</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-indigo-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Explore Student Services</p>
                  <p className="text-xs text-gray-600">Access academic support and resources</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Courses Grid */}
        {enrolledCourses.length > 0 && (
          <div className="mb-6 md:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Enrolled Courses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {enrolledCourses.slice(0, 4).map((course, index) => (
                <div key={course.id} className={`rounded-lg shadow-sm p-3 md:p-4 border-l-4 ${
                  index % 4 === 0 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-400' :
                  index % 4 === 1 ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400' :
                  index % 4 === 2 ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-400' :
                  'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">{course.course_code}</h4>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{course.course_name}</p>
                    </div>
                    <button
                      onClick={() => handleUnenrollClick(course)}
                      className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-shrink-0"
                    >
                      Unenroll
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Semester: {course.semester}</p>
                    <p>Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
            {enrolledCourses.length > 4 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Showing 4 of {enrolledCourses.length} courses. 
                  <a href="/course-selection" className="text-indigo-600 hover:underline ml-1">
                    View all courses
                  </a>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Unenroll Confirmation Modal */}
        {showUnenrollModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Unenrollment</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to unenroll from <strong>{courseToUnenroll?.course_code} - {courseToUnenroll?.course_name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleUnenrollCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnenrollConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Unenroll
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 