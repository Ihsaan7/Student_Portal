"use client";
import DashboardLayout from "../components/DashboardLayout";

export default function ProgressPage() {
  const courses = [
    {
      id: 1,
      name: "CS101 - Programming Fundamentals",
      instructor: "Dr. Sarah Johnson",
      progress: 75,
      grade: "A-",
      assignments: 8,
      completed: 6
    },
    {
      id: 2,
      name: "MATH201 - Calculus II",
      instructor: "Prof. Michael Chen",
      progress: 60,
      grade: "B+",
      assignments: 10,
      completed: 6
    },
    {
      id: 3,
      name: "ENG101 - Academic Writing",
      instructor: "Dr. Emily Davis",
      progress: 90,
      grade: "A",
      assignments: 5,
      completed: 5
    },
    {
      id: 4,
      name: "PHY101 - Physics I",
      instructor: "Prof. Robert Wilson",
      progress: 45,
      grade: "B-",
      assignments: 12,
      completed: 5
    }
  ];

  const getProgressColor = (progress) => {
    if (progress >= 80) return "text-green-600 bg-green-100";
    if (progress >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return "text-green-600 bg-green-100";
    if (grade.startsWith('B')) return "text-blue-600 bg-blue-100";
    if (grade.startsWith('C')) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <DashboardLayout currentPage="/progress">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Progress</h1>
          <p className="text-gray-600">Track your performance across all enrolled courses.</p>
        </div>

        {/* Overall Progress Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(courses.reduce((acc, course) => acc + course.progress, 0) / courses.length)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Assignments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {courses.reduce((acc, course) => acc + course.completed, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current GPA</p>
                <p className="text-2xl font-semibold text-gray-900">3.4</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Progress</h2>
          <div className="space-y-6">
            {courses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
                    <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(course.grade)}`}>
                      {course.grade}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(course.progress)}`}>
                      {course.progress}% Complete
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        course.progress >= 80 ? 'bg-green-500' : 
                        course.progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Assignments: {course.completed}/{course.assignments} completed</span>
                  <span>Last updated: 2 days ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 