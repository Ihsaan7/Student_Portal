'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMiddleware from '../../../components/AdminMiddleware';
import { logAdminAction } from '../../../lib/adminAuth';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../components/ThemeProvider';

const CoursesManagement = ({ adminData }) => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadCoursesData();
    logAdminAction('view_courses');
  }, []);

  const loadCoursesData = async () => {
    try {
      setLoading(true);
      
      // Get enrolled courses and users separately, then join manually
      // This approach avoids potential foreign key relationship issues
      
      // Get enrolled courses first
      const { data: rawEnrollments, error: enrollmentsError } = await supabase
        .from('enrolled_courses')
        .select('*')
        .order('enrolled_at', { ascending: false });
      
      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        console.error('Error details:', JSON.stringify(enrollmentsError, null, 2));
        setError(`Failed to load enrollments: ${enrollmentsError?.message || 'Unknown error'}`);
        return;
      }
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        console.error('Error details:', JSON.stringify(usersError, null, 2));
        setError(`Failed to load users: ${usersError?.message || 'Unknown error'}`);
        return;
      }
      
      // Manually join the data
      const enrolledCourses = rawEnrollments?.map(enrollment => {
        const user = users?.find(u => u.id === enrollment.user_id);
        return {
          ...enrollment,
          users: user || null
        };
      }) || [];
      
      // Data fetched successfully, process the results

      // Process the data to get unique courses and enrollment stats
      const courseMap = new Map();
      const enrollmentsList = [];

      enrolledCourses.forEach(enrollment => {
        const courseKey = `${enrollment.course_name}_${enrollment.semester}`;
        
        if (!courseMap.has(courseKey)) {
          courseMap.set(courseKey, {
            id: courseKey,
            course_name: enrollment.course_name,
            course_code: enrollment.course_code,
            semester: enrollment.semester,
            credits: enrollment.credits,
            enrollments: 0,
            students: []
          });
        }
        
        const course = courseMap.get(courseKey);
        course.enrollments++;
        course.students.push({
          user_id: enrollment.user_id,
          enrolled_at: enrollment.enrolled_at
        });
        
        enrollmentsList.push({
          ...enrollment,
          course_key: courseKey,
          student_email: enrollment.users?.email || 'N/A',
          student_name: enrollment.users?.name || 'N/A'
        });
      });

      setCourses(Array.from(courseMap.values()));
      setEnrollments(enrollmentsList);
      
    } catch (err) {
      console.error('Error loading courses data:', err);
      console.error('Error stack:', err.stack);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      setError(`Failed to load courses data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentStats = () => {
    const totalEnrollments = enrollments.length;
    const uniqueCourses = courses.length;
    const avgEnrollmentsPerCourse = uniqueCourses > 0 ? (totalEnrollments / uniqueCourses).toFixed(1) : 0;
    
    return {
      totalEnrollments,
      uniqueCourses,
      avgEnrollmentsPerCourse
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const stats = getEnrollmentStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="text-primary hover:text-primary/80 mr-4 transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                <span className="hidden sm:inline">Courses Management</span>
                <span className="sm:hidden">Courses</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md transition-all duration-200 hover:bg-muted/50 cursor-pointer border border-border hover:border-primary/30"
                style={{ 
                  backgroundColor: 'hsl(var(--muted))', 
                  color: 'hsl(var(--muted-foreground))' 
                }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold hover:text-destructive/80 cursor-pointer">×</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-md">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold hover:text-primary/80 cursor-pointer">×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-primary/20 border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">📚</div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Total Courses</h3>
                <p className="text-2xl font-bold text-primary">{stats.uniqueCourses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm border border-primary/20 border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">👥</div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Total Enrollments</h3>
                <p className="text-2xl font-bold text-primary">{stats.totalEnrollments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm border border-primary/20 border-l-4 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
            <div className="flex items-center">
              <div className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">📊</div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Avg. Enrollments</h3>
                <p className="text-2xl font-bold text-primary">{stats.avgEnrollmentsPerCourse}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg shadow-sm border border-primary/20 mb-6 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
          <div className="border-b border-border">
            <nav className="-mb-px flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 sm:py-4 px-4 sm:px-6 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <span className="hidden sm:inline">Courses Overview</span>
                <span className="sm:hidden">Courses</span>
              </button>
              <button
                onClick={() => setActiveTab('enrollments')}
                className={`py-3 sm:py-4 px-4 sm:px-6 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'enrollments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <span className="hidden sm:inline">All Enrollments</span>
                <span className="sm:hidden">Enrollments</span>
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="bg-card rounded-lg shadow-sm border border-primary/20 p-8 text-center border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
            <LoadingSpinner size="medium" variant="primary" />
            <p className="mt-2 text-muted-foreground">Loading courses data...</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm border border-primary/20 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
            {activeTab === 'overview' ? (
              <div>
                <div className="px-4 sm:px-6 py-4 border-b border-border">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Courses Overview</h2>
                </div>
                {courses.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">📚</div>
                    <p className="text-muted-foreground">No courses found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Code
                          </th>
                          <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Semester
                          </th>
                          <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Credit Hours
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Enrollments
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 sm:px-6 py-4">
                              <div className="text-sm font-medium text-foreground">
                                {course.course_name}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                              {course.course_code}
                            </td>
                            <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                              {course.semester}
                            </td>
                            <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                              {course.credits}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-primary/10 text-primary border border-primary/20">
                                {course.enrollments} students
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="px-4 sm:px-6 py-4 border-b border-border">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">All Enrollments</h2>
                </div>
                {enrollments.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="text-muted-foreground">No enrollments found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Course
                          </th>
                          <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Code
                          </th>
                          <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Semester
                          </th>
                          <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Enrolled Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {enrollments.map((enrollment, index) => (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 sm:px-6 py-4">
                              <div className="text-sm font-medium text-foreground">
                                {enrollment.student_name}
                              </div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {enrollment.student_email}
                              </div>
                              <div className="text-xs text-muted-foreground/70">
                                ID: {enrollment.user_id}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="text-sm font-medium text-foreground">
                                {enrollment.course_name}
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                              {enrollment.course_code}
                            </td>
                            <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                              {enrollment.semester}
                            </td>
                            <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                              {formatDate(enrollment.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const CoursesManagementPage = () => {
  return (
    <AdminMiddleware requiredPermission="manage_courses">
      {(adminData) => <CoursesManagement adminData={adminData} />}
    </AdminMiddleware>
  );
};

export default CoursesManagementPage;