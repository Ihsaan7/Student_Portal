"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { useToast, ToastContainer } from "../components/Toast";

export default function CourseSelectionPage() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [userProgramme, setUserProgramme] = useState("");
  const [user, setUser] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const { toasts, showSuccess, showError, removeToast, showWarning, showInfo } = useToast();

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
    const course = availableCourses.find(c => c.id === courseId);
    
    // Don't allow selection of already enrolled courses
    if (course && isAlreadyEnrolled(course)) {
      showInfo("You are already enrolled in this course");
      return;
    }
    
    if (selectedCourses.includes(courseId)) {
      // Remove course without confirmation
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleEnrollment = async () => {
    if (!user) {
      showError("Please log in to enroll in courses");
      return;
    }

    setIsEnrolling(true);

    try {
      const selectedCoursesData = availableCourses.filter(course => 
        selectedCourses.includes(course.id) && !isAlreadyEnrolled(course)
      );
      
      console.log('User:', user);
      console.log('Selected courses:', selectedCourses);
      console.log('Available courses:', availableCourses);
      console.log('Selected courses data:', selectedCoursesData);
      
      // Check for already enrolled courses
      const alreadyEnrolledCourses = selectedCoursesData.filter(course => 
        enrolledCourses.some(ec => 
          ec.course_code === course.code && 
          ec.semester === selectedSemester
        )
      );

      if (alreadyEnrolledCourses.length > 0) {
        const courseNames = alreadyEnrolledCourses.map(c => c.name).join(', ');
        showWarning(`You are already enrolled in: ${courseNames}`);
        setIsEnrolling(false);
        return;
      }

      // Filter out already enrolled courses
      const newCoursesToEnroll = selectedCoursesData.filter(course => 
        !enrolledCourses.some(ec => 
          ec.course_code === course.code && 
          ec.semester === selectedSemester
        )
      );

      if (newCoursesToEnroll.length === 0) {
        showInfo("All selected courses are already enrolled");
        setIsEnrolling(false);
        return;
      }
      
      // Prepare enrollment data
      const enrollmentData = newCoursesToEnroll.map(course => ({
        user_id: user.id,
        course_code: course.code,
        course_name: course.name,
        credits: course.credits,
        semester: selectedSemester,
        programme: userProgramme
      }));

      console.log('Attempting to enroll with data:', enrollmentData);
      console.log('Supabase client:', supabase);

      // Test the connection first
      const { data: testData, error: testError } = await supabase
        .from('enrolled_courses')
        .select('count')
        .limit(1);

      console.log('Connection test result:', { testData, testError });

      // Save enrollments to database
      const { data, error } = await supabase
        .from('enrolled_courses')
        .insert(enrollmentData)
        .select();

      console.log('Full response:', { data, error, errorType: typeof error, errorKeys: error ? Object.keys(error) : 'no error' });

      if (error) {
        console.error('Enrollment error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        
        if (error.code === '42P01') {
          showError('Database table not found. Please run the SQL setup script in your Supabase dashboard first.');
        } else if (error.code === '23505') {
          // Handle duplicate key constraint violation
          showWarning('Some courses are already enrolled. Please refresh the page to see updated enrollment status.');
        } else {
          showError(`Error enrolling in courses: ${error.message || 'Unknown error occurred'}`);
        }
        return;
      }

      console.log('Enrollment successful:', data);

      // Update local state
      setEnrolledCourses([...enrolledCourses, ...enrollmentData]);
      setSelectedCourses([]);
      
      showSuccess(`Successfully enrolled in ${newCoursesToEnroll.length} course(s)!`);
      
      // Refresh enrolled courses from database instead of reloading page
      await refreshEnrolledCourses();

    } catch (error) {
      console.error('Unexpected enrollment error:', error);
      console.error('Error stack:', error.stack);
      showError(`Unexpected error: ${error.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  const refreshEnrolledCourses = async () => {
    if (user) {
      const { data: enrollments, error } = await supabase
        .from('enrolled_courses')
        .select('*')
        .eq('user_id', user.id);
      
      if (!error) {
        setEnrolledCourses(enrollments || []);
      }
    }
  };

  const getEnrollmentStatus = (course) => {
    // Get actual enrollment count from database
    const enrolledCount = enrolledCourses.filter(ec => ec.course_code === course.code).length;
    const percentage = (enrolledCount / course.capacity) * 100;
    
    if (percentage >= 90) return { status: "Full", color: "text-red-600 bg-red-100", count: enrolledCount };
    if (percentage >= 75) return { status: "Almost Full", color: "text-yellow-600 bg-yellow-100", count: enrolledCount };
    return { status: "Available", color: "text-green-600 bg-green-100", count: enrolledCount };
  };

  const isAlreadyEnrolled = (course) => {
    return enrolledCourses.some(ec => 
      ec.course_code === course.code && 
      ec.semester === selectedSemester
    );
  };

  const selectedCoursesData = availableCourses.filter(course => 
    selectedCourses.includes(course.id) && !isAlreadyEnrolled(course)
  );
  const totalCredits = selectedCoursesData.reduce((sum, course) => sum + course.credits, 0);

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      
      // Test 1: Check if we can connect to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Auth test - User:', user);
      
      // Test 2: Check if the table exists
      const { data: tableTest, error: tableError } = await supabase
        .from('enrolled_courses')
        .select('*')
        .limit(1);
      
      console.log('Table test - Data:', tableTest, 'Error:', tableError);
      
      // Test 3: Try to insert a test record
      if (user) {
        const { data: insertTest, error: insertError } = await supabase
          .from('enrolled_courses')
          .insert({
            user_id: user.id,
            course_code: 'TEST001',
            course_name: 'Test Course',
            credits: 1,
            semester: 'Test Semester',
            programme: 'Test Programme'
          })
          .select();
        
        console.log('Insert test - Data:', insertTest, 'Error:', insertError);
        
        // Clean up test record
        if (insertTest && insertTest.length > 0) {
          const { error: deleteError } = await supabase
            .from('enrolled_courses')
            .delete()
            .eq('course_code', 'TEST001');
          
          console.log('Cleanup test - Error:', deleteError);
        }
      }
      
    } catch (error) {
      console.error('Database connection test failed:', error);
    }
  };

  // Test database connection on component mount
  useEffect(() => {
    testDatabaseConnection();
  }, []);

  // Get user and enrolled courses on component mount
  useEffect(() => {
    const getUserAndEnrollments = async () => {
      // Debug Supabase configuration
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (user) {
        setUser(user);
        
        // Get user's enrolled courses
        const { data: enrollments, error } = await supabase
          .from('enrolled_courses')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching enrollments:', error);
          if (error.code === '42P01') {
            console.log('Table does not exist yet. Please run the SQL setup script.');
          }
          setEnrolledCourses([]);
        } else {
          setEnrolledCourses(enrollments || []);
        }
      }
    };

    getUserAndEnrollments();
  }, []);

  // Set default programme
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedProgramme = urlParams.get('programme') || localStorage.getItem('selectedProgramme') || "Bachelor of Science in Software Engineering (BSSE)";
    setUserProgramme(selectedProgramme);
  }, []);

  return (
    <DashboardLayout currentPage="/course-selection">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Course Selection</h1>
          <p className="text-sm sm:text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>Browse and enroll in courses for your selected programme and semester.</p>
        </div>

        {/* Programme and Semester Selection */}
        <div className="rounded-lg shadow-sm p-4 sm:p-6 mb-6 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <label className="text-xs sm:text-sm font-medium block mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>Programme:</label>
                <div className="text-sm sm:text-base lg:text-lg font-semibold truncate" style={{ color: 'hsl(var(--primary))' }}>{userProgramme}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <label className="text-xs sm:text-sm font-medium whitespace-nowrap" style={{ color: 'hsl(var(--card-foreground))' }}>Semester:</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg focus:outline-none focus:ring-2 text-sm"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    '--tw-ring-color': 'hsl(var(--primary))'
                  }}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:max-w-xs lg:max-w-md">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 text-sm"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    '--tw-ring-color': 'hsl(var(--primary))'
                  }}
                  suppressHydrationWarning={true}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          {/* Course List */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="rounded-lg shadow-sm p-4 sm:p-6 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h2 className="text-base sm:text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>
                Available Courses {selectedSemester && `- ${selectedSemester}`}
              </h2>
              
              {!selectedSemester ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p style={{ color: 'hsl(var(--muted-foreground))' }}>Please select a semester to view available courses</p>
                </div>
              ) : availableCourses.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                  <p style={{ color: 'hsl(var(--muted-foreground))' }}>No courses found for the selected criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableCourses.map((course) => {
                    const enrollmentStatus = getEnrollmentStatus(course);
                    const alreadyEnrolled = isAlreadyEnrolled(course);
                    return (
                      <div key={course.id} className="rounded-lg p-3 sm:p-4 transition-all w-full max-w-full" style={{
                        border: alreadyEnrolled 
                          ? '1px solid hsl(var(--primary))' 
                          : '1px solid hsl(var(--border))',
                        backgroundColor: alreadyEnrolled 
                          ? 'hsl(var(--primary) / 0.1)' 
                          : 'transparent'
                      }}>
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 space-y-3 lg:space-y-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--card-foreground))' }}>{course.code}</h3>
                              <span className="text-xs sm:text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>•</span>
                              <span className="text-xs sm:text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.credits} credits</span>
                              {alreadyEnrolled && (
                                <span className="px-2 py-1 text-xs rounded-full font-medium" style={{
                                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                                  color: 'hsl(var(--primary))'
                                }}>
                                  ✓ Enrolled
                                </span>
                              )}
                            </div>
                            <h4 className="text-base sm:text-lg font-medium mb-1 break-words" style={{ color: 'hsl(var(--card-foreground))' }}>{course.name}</h4>
                            <p className="text-xs sm:text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.instructor}</p>
                            <p className="text-xs sm:text-sm mb-3 break-words" style={{ color: 'hsl(var(--card-foreground))' }}>{course.description}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <span className="font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>Schedule:</span>
                                <p className="break-words" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.schedule}</p>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>Prerequisites:</span>
                                <p className="break-words" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.prerequisites}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start space-x-2 lg:space-x-0 lg:space-y-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${enrollmentStatus.color}`}>
                              {enrollmentStatus.status}
                            </span>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {enrollmentStatus.count}/{course.capacity} enrolled
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 space-y-2 sm:space-y-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                          <span className="text-xs sm:text-sm truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.department}</span>
                          <button
                            onClick={() => handleCourseSelection(course.id)}
                            disabled={enrollmentStatus.status === "Full" || alreadyEnrolled}
                            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition w-full sm:w-auto"
                            style={{
                              backgroundColor: alreadyEnrolled
                                ? 'hsl(var(--primary))'
                                : selectedCourses.includes(course.id)
                                ? 'hsl(var(--destructive))'
                                : enrollmentStatus.status === "Full"
                                ? 'hsl(var(--muted))'
                                : 'hsl(var(--primary))',
                              color: alreadyEnrolled
                                ? 'hsl(var(--primary-foreground))'
                                : selectedCourses.includes(course.id)
                                ? 'hsl(var(--destructive-foreground))'
                                : enrollmentStatus.status === "Full"
                                ? 'hsl(var(--muted-foreground))'
                                : 'hsl(var(--primary-foreground))',
                              cursor: enrollmentStatus.status === "Full" || alreadyEnrolled ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {alreadyEnrolled 
                              ? 'Already Enrolled' 
                              : selectedCourses.includes(course.id) 
                              ? 'Remove' 
                              : 'Add Course'
                            }
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
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-6 w-full max-w-full" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h2 className="text-base sm:text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Selected Courses</h2>
              
              {selectedCoursesData.length === 0 ? (
                <p className="text-center py-6 sm:py-8 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No courses selected</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 lg:max-h-96 overflow-y-auto">
                    {selectedCoursesData.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.1)' }}>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" style={{ color: 'hsl(var(--card-foreground))' }}>{course.code}</p>
                          <p className="text-xs sm:text-sm truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.name}</p>
                        </div>
                        <span className="text-xs sm:text-sm flex-shrink-0 ml-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{course.credits} cr</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-3 sm:pt-4 mb-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm sm:text-base" style={{ color: 'hsl(var(--card-foreground))' }}>Total Credits:</span>
                      <span className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--card-foreground))' }}>{totalCredits}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleEnrollment}
                    disabled={isEnrolling || selectedCoursesData.length === 0}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition font-medium text-sm sm:text-base ${
                      isEnrolling || selectedCoursesData.length === 0
                        ? 'cursor-not-allowed'
                        : 'hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: isEnrolling || selectedCoursesData.length === 0
                        ? 'hsl(var(--muted))'
                        : 'hsl(var(--primary))',
                      color: isEnrolling || selectedCoursesData.length === 0
                        ? 'hsl(var(--muted-foreground))'
                        : 'hsl(var(--primary-foreground))'
                    }}
                  >
                    {isEnrolling ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'currentColor' }}>
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xs sm:text-sm">Enrolling...</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm">
                        Enroll in {selectedCoursesData.length} Course{selectedCoursesData.length !== 1 ? 's' : ''}
                      </span>
                    )}
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