"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardLayout from "../components/DashboardLayout";
import AdminOnlyButton from "../components/AdminOnlyButton";
import AdminControlPanel from "../components/AdminControlPanel";
import CourseAdminPanel from "../components/CourseAdminPanel";
import AdvancedAdminPanel from "../components/AdvancedAdminPanel";
import LoadingSpinner from "../components/LoadingSpinner";

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
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          setLoading(false);
          router.push('/login');
          return;
        }
        
        if (!user) {
          setLoading(false);
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
          console.log('User profile error details:', error.message, error.code);
          // Create a basic profile if none exists
          if (error.code === 'PGRST116') {
            console.log('No user profile found, creating basic profile from auth data');
            setUserProfile({
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Student',
              email: user.email,
              programme: 'Not set'
            });
          }
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
      } catch (error) {
        console.error('Unexpected error in checkUser:', error);
        setLoading(false);
        router.push('/login');
      }
    };

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Loading timeout reached, stopping loading state');
      setLoading(false);
    }, 10000); // 10 second timeout

    checkUser().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center max-w-md mx-auto px-4">
          <LoadingSpinner size="large" variant="primary" />
          <div className="text-xl font-semibold mb-2 mt-4" style={{ color: 'hsl(var(--foreground))' }}>Loading Home...</div>
          <div className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Please wait while we fetch your data</div>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            If this takes too long, please check your internet connection or try refreshing the page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout currentPage="/home">
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4">
        {/* Welcome Section */}
        <div className="rounded-xl shadow-sm p-4 sm:p-6 md:p-8 mb-6 md:mb-8 border-2 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <span className="text-3xl font-bold" style={{ color: 'hsl(var(--primary-foreground))' }}>
                {userProfile?.name?.charAt(0) || user?.email?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
                Welcome back, {userProfile?.name || 'Student'}!
              </h2>
              <p className="text-base md:text-lg mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{user?.email}</p>
              {userProfile?.programme && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  {shortenProgramme(userProfile.programme)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Semester Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-10 w-full">
          <div className="rounded-xl shadow-sm p-4 sm:p-6 border-2 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6" style={{ color: 'hsl(var(--card-foreground))' }}>Current Semester</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>Programme:</span>
                <span className="font-medium text-base" style={{ color: 'hsl(var(--card-foreground))' }}>{shortenProgramme(userProfile?.programme)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>Semester:</span>
                <span className="font-medium text-base" style={{ color: 'hsl(var(--card-foreground))' }}>Semester 1</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>Enrolled Courses:</span>
                <span className="font-medium text-base" style={{ color: 'hsl(var(--card-foreground))' }}>{enrolledCourses.length}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/course-selection" className="inline-flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Enroll in Courses
              </a>
              
              {/* Admin Only Button Example */}
              <AdminOnlyButton
                variant="secondary"
                onClick={(e, adminData) => {
                  alert(`Admin ${adminData.userId} clicked: Force Enroll Student`);
                }}
                title="Force enroll student in courses"
              >
                Force Enroll
              </AdminOnlyButton>
            </div>
          </div>

          <div className="rounded-xl shadow-sm p-4 sm:p-6 border-2 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v18a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h8l4 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>How to Use This Portal</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Watch this quick guide to get started</p>
              </div>
            </div>
            
            <div className="relative w-full">
              {/* Video Player Container - Click to Watch */}
              <div 
                className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-lg cursor-pointer group transition-all duration-200 hover:shadow-xl"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
                onClick={() => {
                  window.open(
                    'https://drive.google.com/file/d/15Ll8MOjQ3GmQ-QdN1QIvI_XizcSbCF1O/view',
                    'StudentNestTutorial',
                    'width=1200,height=800,left=' + ((window.screen.width - 1200) / 2) + ',top=' + ((window.screen.height - 800) / 2) + ',resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no'
                  );
                }}
              >
                {/* Video Thumbnail/Preview */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-200" style={{ borderRadius: '8px' }}></div>
                  
                  {/* Large Play Button */}
                  <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  
                  {/* Video Info */}
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors" style={{ color: 'hsl(var(--card-foreground))' }}>
                      🎥 Tutorial Video
                    </h4>
                    <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Complete guide to using StudentNest Portal
                    </p>
                    <div className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm group-hover:shadow-md transition-all duration-200" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Watch Now
                    </div>
                    <p className="text-xs mt-2 opacity-75" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Opens in new window • ~5 minutes
                    </p>
                  </div>
                  
                  {/* Corner indicators */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    HD Quality
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
                    Tutorial
                  </div>
                </div>
              </div>
            </div>
            

          </div>
        </div>

        {/* Enrolled Courses Grid */}
        {enrolledCourses.length > 0 && (
          <div className="mb-10 p-4 sm:p-6 rounded-xl border-2 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)', borderColor: 'hsl(var(--border))' }}>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6" style={{ color: 'hsl(var(--foreground))' }}>Your Enrolled Courses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
              {enrolledCourses.slice(0, 4).map((course, index) => (
                <div 
                  key={course.id} 
                  className="rounded-xl shadow-sm p-4 sm:p-5 border-2 cursor-pointer hover:shadow-lg transition-all duration-300 group w-full max-w-full"
                  style={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                  }}
                  onClick={() => router.push(`/course/${course.course_code}`)}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ 
                          backgroundColor: index % 4 === 0 ? 'hsl(220 70% 50%)' :
                                         index % 4 === 1 ? 'hsl(142 70% 50%)' :
                                         index % 4 === 2 ? 'hsl(262 70% 50%)' :
                                         'hsl(25 70% 50%)'
                        }}></div>
                        <h4 className="font-semibold text-base truncate" style={{ color: 'hsl(var(--card-foreground))' }}>{course.course_code}</h4>
                      </div>
                      <p className="text-sm mb-3 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.course_name}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnenrollClick(course);
                      }}
                      className="sm:ml-3 px-3 py-1.5 text-xs rounded-lg transition-all duration-200 flex-shrink-0 hover:shadow-sm w-full sm:w-auto"
                      style={{ 
                        backgroundColor: 'hsl(var(--destructive) / 0.1)', 
                        color: 'hsl(var(--destructive))',
                        border: '1px solid hsl(var(--destructive) / 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'hsl(var(--destructive))';
                        e.target.style.color = 'hsl(var(--destructive-foreground))';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'hsl(var(--destructive) / 0.1)';
                        e.target.style.color = 'hsl(var(--destructive))';
                      }}
                    >
                      Unenroll
                    </button>
                  </div>
                  <div className="text-sm space-y-1 mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <p>Semester: {course.semester}</p>
                    <p>Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-sm font-medium group-hover:translate-x-1 transition-transform duration-200" style={{ color: 'hsl(var(--primary))' }}>
                    View course details →
                  </div>
                </div>
              ))}
            </div>
            {enrolledCourses.length > 4 && (
              <div className="mt-6 text-center">
                <a 
                  href="/course-selection" 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'hsl(var(--secondary))', 
                    color: 'hsl(var(--secondary-foreground))',
                    border: '1px solid hsl(var(--border))'
                  }}
                >
                  View all courses ({enrolledCourses.length})
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Unenroll Confirmation Modal */}
        {showUnenrollModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              className="rounded-xl p-4 md:p-6 max-w-md w-full mx-4 shadow-2xl border-2"
              style={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))'
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Confirm Unenrollment</h3>
              <p className="mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Are you sure you want to unenroll from <strong style={{ color: 'hsl(var(--foreground))' }}>{courseToUnenroll?.course_code} - {courseToUnenroll?.course_name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleUnenrollCancel}
                  className="flex-1 px-4 py-2 rounded-lg border transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'hsl(var(--secondary))', 
                    color: 'hsl(var(--secondary-foreground))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnenrollConfirm}
                  className="flex-1 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'hsl(var(--destructive))', 
                    color: 'hsl(var(--destructive-foreground))'
                  }}
                >
                  Unenroll
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Admin Control Panel - Only visible when admin is testing as user */}
        <AdminControlPanel 
          userId={user?.id} 
          userProfile={userProfile} 
          onUpdate={() => {
            // Refresh user data when admin makes changes
            window.location.reload();
          }} 
        />
        
        {/* Course Admin Panel - For course-specific admin actions */}
        {enrolledCourses.length > 0 && enrolledCourses.map((course) => (
          <CourseAdminPanel
            key={course.id}
            courseId={course.id}
            courseName={course.name}
            onUpdate={() => {
              // Refresh course data when admin makes changes
              window.location.reload();
            }}
          />
        ))}
        
        {/* Advanced Admin Panel - For monitoring and system control */}
        <AdvancedAdminPanel 
          userId={user?.id} 
          userProfile={userProfile} 
        />
      </div>
    </DashboardLayout>
  );
}