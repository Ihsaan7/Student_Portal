"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState, useEffect } from "react";

export default function CourseSelectionPage() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [userProgramme, setUserProgramme] = useState("");

  const semesters = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"];

  // Sample BSSE and BSCS courses for Semester 1 (will expand this)
  const programmeCourses = {
    "Bachelor of Science in Software Engineering (BSSE)": {
      "Semester 1": [
        { id: "CS101", code: "CS101", name: "Introduction to Computing", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Introduction to Computing", prerequisites: "None", department: "Computer Science" },
        { id: "ENG101", code: "ENG101", name: "English Comprehension", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "English Comprehension", prerequisites: "None", department: "English" },
        { id: "ECO401", code: "ECO401", name: "Economics", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Economics", prerequisites: "None", department: "Economics" },
        { id: "MGT211", code: "MGT211", name: "Introduction To Business", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Introduction To Business", prerequisites: "None", department: "Management" },
        { id: "MTH101", code: "MTH101", name: "Calculus And Analytical Geometry", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Calculus And Analytical Geometry", prerequisites: "None", department: "Mathematics" },
        { id: "PAK301", code: "PAK301", name: "Pakistan Studies", credits: 2, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Pakistan Studies", prerequisites: "None", department: "Pakistan Studies" },
        { id: "PHY101", code: "PHY101", name: "Physics", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Physics", prerequisites: "None", department: "Physics" },
        { id: "VU001", code: "VU001", name: "Introduction to e-Learning", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Introduction to e-Learning", prerequisites: "None", department: "General" }
      ],
      "Semester 2": [
        { id: "CS201", code: "CS201", name: "Introduction to Programming", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Introduction to Programming", prerequisites: "None", department: "Computer Science" },
        { id: "CS201P", code: "CS201P", name: "Introduction to Programming (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Introduction to Programming (Practical)", prerequisites: "None", department: "Computer Science" },
        { id: "ENG201", code: "ENG201", name: "Business and Technical English Writing", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Business and Technical English Writing", prerequisites: "None", department: "English" },
        { id: "ETH202", code: "ETH202", name: "Ethics (for Non-Muslims)", credits: 2, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Ethics (for Non-Muslims)", prerequisites: "None", department: "General" },
        { id: "ISL202", code: "ISL202", name: "Islamic Studies", credits: 2, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Islamic Studies", prerequisites: "None", department: "Islamic Studies" },
        { id: "MGT301", code: "MGT301", name: "Principles of Marketing", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Principles of Marketing", prerequisites: "None", department: "Management" },
        { id: "MGT503", code: "MGT503", name: "Principles of Management", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Principles of Management", prerequisites: "None", department: "Management" },
        { id: "MTH202", code: "MTH202", name: "Discrete Mathematics", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Discrete Mathematics", prerequisites: "None", department: "Mathematics" },
        { id: "MTH501", code: "MTH501", name: "Linear Algebra", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Linear Algebra", prerequisites: "None", department: "Mathematics" }
      ],
      "Semester 3": [
        { id: "CS301", code: "CS301", name: "Data Structures", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Data Structures", prerequisites: "None", department: "Computer Science" },
        { id: "CS301P", code: "CS301P", name: "Data Structures (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Data Structures (Practical)", prerequisites: "None", department: "Computer Science" },
        { id: "CS304", code: "CS304", name: "Object Oriented Programming", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Object Oriented Programming", prerequisites: "None", department: "Computer Science" },
        { id: "CS304P", code: "CS304P", name: "Object Oriented Programming (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Object Oriented Programming (Practical)", prerequisites: "None", department: "Computer Science" },
        { id: "CS601", code: "CS601", name: "Data Communication", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Data Communication", prerequisites: "None", department: "Computer Science" },
        { id: "CS625", code: "CS625", name: "Professional Practices", credits: 2, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Professional Practices", prerequisites: "None", department: "Computer Science" },
        { id: "MGT201", code: "MGT201", name: "Financial Management", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Financial Management", prerequisites: "None", department: "Management" },
        { id: "MGT501", code: "MGT501", name: "Human Resource Management", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Human Resource Management", prerequisites: "None", department: "Management" }
      ],
      "Semester 4": [
        { id: "CS403", code: "CS403", name: "Database Management Systems", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Database Management Systems", prerequisites: "None", department: "Computer Science" },
        { id: "CS403P", code: "CS403P", name: "Database Management Systems (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Database Management Systems (Practical)", prerequisites: "None", department: "Computer Science" },
        { id: "CS504", code: "CS504", name: "Software Engineering - I", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Engineering - I", prerequisites: "None", department: "Software Engineering" },
        { id: "CS604", code: "CS604", name: "Operating Systems", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Operating Systems", prerequisites: "None", department: "Computer Science" },
        { id: "CS604P", code: "CS604P", name: "Operating Systems (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Operating Systems (Practical)", prerequisites: "None", department: "Computer Science" },
        { id: "CS610", code: "CS610", name: "Computer Networks", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Computer Networks", prerequisites: "None", department: "Computer Science" },
        { id: "CS610P", code: "CS610P", name: "Computer Networks (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Computer Networks (Practical)", prerequisites: "None", department: "Computer Science" },
        { id: "STA301", code: "STA301", name: "Statistics and Probability", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Statistics and Probability", prerequisites: "None", department: "Statistics" }
      ],
      "Semester 5": [
        { id: "CS401", code: "CS401", name: "Computer Architecture and Assembly Language Programming", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Computer Architecture and Assembly Language Programming", prerequisites: "None", department: "Computer Science" },
        { id: "CS408", code: "CS408", name: "Human Computer Interaction", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Human Computer Interaction", prerequisites: "None", department: "Computer Science" },
        { id: "CS510", code: "CS510", name: "Software Requirements and Specifications", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Requirements and Specifications", prerequisites: "None", department: "Software Engineering" },
        { id: "CS511", code: "CS511", name: "Web Engineering", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Web Engineering", prerequisites: "None", department: "Software Engineering" },
        { id: "MCM301", code: "MCM301", name: "Communication skills", credits: 2, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Communication skills", prerequisites: "None", department: "General" },
        { id: "MTH601", code: "MTH601", name: "Operations Research", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Operations Research", prerequisites: "None", department: "Mathematics" }
      ],
      "Semester 6": [
        { id: "CS614", code: "CS614", name: "Data Warehousing", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Data Warehousing", prerequisites: "None", department: "Computer Science" },
        { id: "CS202", code: "CS202", name: "Fundamentals of Front End Development", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Fundamentals of Front End Development", prerequisites: "None", department: "Computer Science" },
        { id: "CS205", code: "CS205", name: "Information Security", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Information Security", prerequisites: "None", department: "Computer Science" },
        { id: "CS603", code: "CS603", name: "Software Architecture and Design", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Architecture and Design", prerequisites: "None", department: "Software Engineering" },
        { id: "CS603P", code: "CS603P", name: "Software Architecture and Design (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Architecture and Design (Practical)", prerequisites: "None", department: "Software Engineering" },
        { id: "CS620", code: "CS620", name: "Modelling and Simulation", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Modelling and Simulation", prerequisites: "None", department: "Computer Science" },
        { id: "IT430", code: "IT430", name: "E-Commerce", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "E-Commerce", prerequisites: "None", department: "IT" },
        { id: "CS411", code: "CS411", name: "Visual Programming", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Visual Programming", prerequisites: "None", department: "Computer Science" }
      ],
      "Semester 7": [
        { id: "CS435", code: "CS435", name: "Cloud Computing", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Cloud Computing", prerequisites: "None", department: "Computer Science" },
        { id: "CS311", code: "CS311", name: "Introduction to Web Services Development", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Introduction to Web Services Development", prerequisites: "None", department: "Computer Science" },
        { id: "CS611", code: "CS611", name: "Software Quality Engineering", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Quality Engineering", prerequisites: "None", department: "Software Engineering" },
        { id: "CS615", code: "CS615", name: "Software Project Management", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Project Management", prerequisites: "None", department: "Software Engineering" },
        { id: "CS619", code: "CS619", name: "Final Project - CS619", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Final Project - CS619", prerequisites: "None", department: "Software Engineering" },
        { id: "MGT101", code: "MGT101", name: "Financial Accounting", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Financial Accounting", prerequisites: "None", department: "Management" },
        { id: "SE601", code: "SE601", name: "Software Construction & Development", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Construction & Development", prerequisites: "None", department: "Software Engineering" },
        { id: "SE601P", code: "SE601P", name: "Software Construction & Development (Practical)", credits: 1, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Construction & Development (Practical)", prerequisites: "None", department: "Software Engineering" }
      ],
      "Semester 8": [
        { id: "CS508", code: "CS508", name: "Modern Programming Languages", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Modern Programming Languages", prerequisites: "None", department: "Computer Science" },
        { id: "CS609", code: "CS609", name: "System Programming", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "System Programming", prerequisites: "None", department: "Computer Science" },
        { id: "CS636", code: "CS636", name: "Formal Methods", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Formal Methods", prerequisites: "None", department: "Computer Science" },
        { id: "SE602", code: "SE602", name: "Software Re-Engineering", credits: 3, instructor: "TBA", schedule: "TBA", capacity: 40, enrolled: 0, description: "Software Re-Engineering", prerequisites: "None", department: "Software Engineering" }
      ]
    },
    // "Bachelor of Computer Science (BCS)": {
    //   "Semester 1": [
    //     {
    //       id: "BSCS_S1_1",
    //       code: "ENG101",
    //       name: "English Comprehension",
    //       credits: 3,
    //       instructor: "Dr. Sarah Johnson",
    //       schedule: "Mon, Wed 10:00 AM - 11:30 AM",
    //       capacity: 40,
    //       enrolled: 35,
    //       description: "Development of reading and writing skills for academic purposes.",
    //       prerequisites: "None",
    //       department: "English"
    //     },
    //     {
    //       id: "BSCS_S1_2",
    //       code: "MTH101",
    //       name: "Calculus and Analytical Geometry",
    //       credits: 3,
    //       instructor: "Prof. Michael Chen",
    //       schedule: "Tue, Thu 2:00 PM - 3:30 PM",
    //       capacity: 35,
    //       enrolled: 30,
    //       description: "Introduction to calculus, limits, derivatives, and analytical geometry.",
    //       prerequisites: "None",
    //       department: "Mathematics"
    //     },
    //     {
    //       id: "BSCS_S1_3",
    //       code: "CS101",
    //       name: "Introduction to Computing",
    //       credits: 3,
    //       instructor: "Dr. Robert Wilson",
    //       schedule: "Mon, Wed 1:00 PM - 2:30 PM",
    //       capacity: 40,
    //       enrolled: 38,
    //       description: "Basic concepts of computing and computer systems.",
    //       prerequisites: "None",
    //       department: "Computer Science"
    //     }
    //   ]
    // }
  };

  // Get available courses based on selected programme and semester
  const getAvailableCourses = () => {
    if (!userProgramme || !selectedSemester) return [];
    
    const courses = programmeCourses[userProgramme]?.[selectedSemester] || [];
    
    if (searchTerm) {
      return courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return courses;
  };

  const availableCourses = getAvailableCourses();

  const handleCourseSelection = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleEnrollment = () => {
    console.log("Enrolling in courses:", selectedCourses);
    alert(`Successfully enrolled in ${selectedCourses.length} course(s)!`);
    setSelectedCourses([]);
  };

  const getEnrollmentStatus = (course) => {
    const percentage = (course.enrolled / course.capacity) * 100;
    if (percentage >= 90) return { status: "Full", color: "text-red-600 bg-red-100" };
    if (percentage >= 75) return { status: "Almost Full", color: "text-yellow-600 bg-yellow-100" };
    return { status: "Available", color: "text-green-600 bg-green-100" };
  };

  const selectedCoursesData = availableCourses.filter(course => selectedCourses.includes(course.id));
  const totalCredits = selectedCoursesData.reduce((sum, course) => sum + course.credits, 0);

  // Set default programme for demo (in real app, this would come from user session)
  useEffect(() => {
    // In a real app, this would come from the user's session or URL parameters
    // For demo purposes, we'll check if there's a programme in localStorage or URL params
    const urlParams = new URLSearchParams(window.location.search);
    const selectedProgramme = urlParams.get('programme') || localStorage.getItem('selectedProgramme') || "Bachelor of Science in Software Engineering (BSSE)";
    setUserProgramme(selectedProgramme);
  }, []);

  return (
    <DashboardLayout currentPage="/course-selection">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Selection</h1>
          <p className="text-gray-600">Browse and enroll in courses for your selected programme and semester.</p>
        </div>

        {/* Programme and Semester Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Programme:</label>
                <div className="text-lg font-semibold text-indigo-700">{userProgramme}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search courses by name, code, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Courses {selectedSemester && `- ${selectedSemester}`}
              </h2>
              
              {!selectedSemester ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-gray-500">Please select a semester to view available courses</p>
                </div>
              ) : availableCourses.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                  <p className="text-gray-500">No courses found for the selected criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableCourses.map((course) => {
                    const enrollmentStatus = getEnrollmentStatus(course);
                    return (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{course.code}</h3>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-600">{course.credits} credits</span>
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">{course.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{course.instructor}</p>
                            <p className="text-sm text-gray-700 mb-3">{course.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Schedule:</span>
                                <p className="text-gray-600">{course.schedule}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Prerequisites:</span>
                                <p className="text-gray-600">{course.prerequisites}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${enrollmentStatus.color}`}>
                              {enrollmentStatus.status}
                            </span>
                            <span className="text-sm text-gray-600">
                              {course.enrolled}/{course.capacity} enrolled
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-600">{course.department}</span>
                          <button
                            onClick={() => handleCourseSelection(course.id)}
                            disabled={enrollmentStatus.status === "Full"}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              selectedCourses.includes(course.id)
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : enrollmentStatus.status === "Full"
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            }`}
                          >
                            {selectedCourses.includes(course.id) ? 'Remove' : 'Add Course'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Courses */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Courses</h2>
              
              {selectedCoursesData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No courses selected</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {selectedCoursesData.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{course.code}</p>
                          <p className="text-sm text-gray-600">{course.name}</p>
                        </div>
                        <span className="text-sm text-gray-600">{course.credits} cr</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Credits:</span>
                      <span className="font-semibold text-gray-900">{totalCredits}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleEnrollment}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    Enroll in {selectedCoursesData.length} Course{selectedCoursesData.length !== 1 ? 's' : ''}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 