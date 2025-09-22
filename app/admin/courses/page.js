'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMiddleware from '../../../components/AdminMiddleware';
import { logAdminAction } from '../../../lib/adminAuth';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

const CoursesManagement = ({ adminData }) => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Courses Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📚</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Courses</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.uniqueCourses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Enrollments</h3>
                <p className="text-2xl font-bold text-green-600">{stats.totalEnrollments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Avg. Enrollments</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.avgEnrollmentsPerCourse}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Courses Overview
              </button>
              <button
                onClick={() => setActiveTab('enrollments')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'enrollments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Enrollments
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <LoadingSpinner size="medium" variant="primary" />
            <p className="mt-2" style={{color: 'hsl(var(--muted-foreground))'}}>Loading courses data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'overview' ? (
              <div>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Courses Overview</h2>
                </div>
                {courses.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No courses found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Semester
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit Hours
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrollments
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {course.course_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {course.course_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {course.semester}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {course.credits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">All Enrollments</h2>
                </div>
                {enrollments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No enrollments found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Semester
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrolled Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {enrollments.map((enrollment, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.student_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.student_email}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {enrollment.user_id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.course_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {enrollment.course_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {enrollment.semester}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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