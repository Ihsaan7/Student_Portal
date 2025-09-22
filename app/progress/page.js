"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProgressPage() {
  const [activeSection, setActiveSection] = useState('academic');
  const [selectedQuotes, setSelectedQuotes] = useState({ academic: '', career: '' });
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [studyStreak, setStudyStreak] = useState(0);
  const [handoutCount, setHandoutCount] = useState(0);
  const [courseStats, setCourseStats] = useState({});
  
  // Career Development States
  const [selectedCareerPath, setSelectedCareerPath] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [careerContent, setCareerContent] = useState(null);
  const [loadingCareerContent, setLoadingCareerContent] = useState(false);

  const motivationalQuotes = {
    academic: [
      "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
      "The beautiful thing about learning is that nobody can take it away from you. - B.B. King",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "The only way to do great work is to love what you do. - Steve Jobs"
    ],
    career: [
      "Your career is like a garden. It takes time to grow, but with patience and care, it will flourish. - Unknown",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
      "The only limit to our realization of tomorrow is our doubts of today. - Franklin D. Roosevelt"
    ]
  };

  // Load user and enrolled courses on component mount
  useEffect(() => {
    const loadUserAndCourses = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user found');
          return;
        }
        setUser(user);

        // Get enrolled courses
        const { data: enrollments, error } = await supabase
          .from('enrolled_courses')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching enrollments:', error);
          setEnrolledCourses([]);
        } else {
          setEnrolledCourses(enrollments || []);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndCourses();
  }, []);

  useEffect(() => {
    if (user && enrolledCourses.length > 0) {
      loadCourseStatistics();
    }
  }, [user, enrolledCourses]);

  // Set quotes on component mount to avoid hydration issues
  useEffect(() => {
    const getRandomQuote = (section) => {
      const quotes = motivationalQuotes[section];
      return quotes[Math.floor(Math.random() * quotes.length)];
    };

    setSelectedQuotes({
      academic: getRandomQuote('academic'),
      career: getRandomQuote('career')
    });
  }, []);

  const getProgressColor = (progress) => {
    if (progress >= 80) return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' };
    if (progress >= 60) return { backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' };
    return { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' };
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' };
    if (grade.startsWith('B')) return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' };
    if (grade.startsWith('C')) return { backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' };
    return { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' };
  };

  // Calculate average progress from enrolled courses
  const calculateAverageProgress = () => {
    if (enrolledCourses.length === 0) return 0;
    const totalProgress = enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0);
    return Math.round(totalProgress / enrolledCourses.length);
  };

  // Load course statistics (study hours, quiz attempts, progress)
  const loadCourseStatistics = async () => {
    if (!user || enrolledCourses.length === 0) return;

    try {
      const stats = {};
      
      for (const course of enrolledCourses) {
        // Get course progress from handout downloads
        const { data: progressData, error: progressError } = await supabase
          .rpc('get_user_course_progress', {
            p_user_id: user.id,
            p_course_code: course.course_code
          });

        // Get quiz attempts
        const { data: quizData, error: quizError } = await supabase
          .rpc('get_user_quiz_attempts', {
            p_user_id: user.id,
            p_course_code: course.course_code
          });

        // Get study hours
        const { data: studyData, error: studyError } = await supabase
          .rpc('get_user_study_hours', {
            p_user_id: user.id,
            p_course_code: course.course_code
          });

        stats[course.course_code] = {
          progress: progressData?.[0]?.progress_percentage || 0,
          handoutsAccessed: progressData?.[0]?.handouts_accessed || 0,
          totalLectures: progressData?.[0]?.total_lectures || 0,
          quizAttempts: quizData || 0,
          studyHours: studyData || 0
        };
      }
      
      setCourseStats(stats);
    } catch (error) {
      console.error('Error loading course statistics:', error);
    }
  };

  // Calculate total completed assignments
  const calculateTotalCompleted = () => {
    return enrolledCourses.reduce((sum, course) => sum + (course.completed_assignments || 0), 0);
  };

  // Load goals and achievements
  useEffect(() => {
    if (user) {
      // Goals and achievements removed - see achievements-backup.js
    }
  }, [user]);

  const calculateStudyStreak = async () => {
    try {
      // Get user's recent activity (logins and handout interactions)
      const { data: activities, error } = await supabase
         .from('handouts')
         .select('created_at')
         .eq('uploader_id', user?.id)
         .order('created_at', { ascending: false })
         .limit(30);
      
      if (error || !activities) {
        setStudyStreak(0);
        return 0;
      }
      
      // Calculate consecutive days of activity
      const today = new Date();
      const activityDates = activities.map(a => {
        const date = new Date(a.created_at);
        return date.toDateString();
      });
      
      let streak = 0;
      let currentDate = new Date(today);
      
      // Check for consecutive days starting from today
      while (streak < 365) { // Max 365 days to prevent infinite loop
        const dateString = currentDate.toDateString();
        if (activityDates.includes(dateString)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      setStudyStreak(streak);
      return streak;
    } catch (error) {
      console.error('Error calculating study streak:', error);
      setStudyStreak(0);
      return 0;
    }
  };

  // Achievements system removed - see achievements-backup.js for complete code



  const addGoal = async () => {
    if (!newGoal.trim()) return;
    
    const goal = {
      id: Date.now(),
      text: newGoal,
      completed: false,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    };
    
    setGoals([...goals, goal]);
    setNewGoal('');
    setShowGoalModal(false);
  };

  const toggleGoal = (goalId) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const deleteGoal = (goalId) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };



  const AcademicSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="large" variant="primary" />
            <p className="mt-4" style={{color: 'hsl(var(--muted-foreground))'}}>Loading your academic progress...</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Motivational Quote */}
        <div 
          className="rounded-lg p-6 mb-8 border-l-4"
          style={{
            background: 'linear-gradient(to right, hsl(var(--muted)), hsl(var(--accent)))',
            borderLeftColor: 'hsl(var(--primary))'
          }}
        >
          <div className="flex items-start">
            <div 
              className="p-2 rounded-lg mr-4"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Today's Academic Inspiration</p>
              <p className="italic" style={{ color: 'hsl(var(--muted-foreground))' }}>"{selectedQuotes.academic || 'Loading...'}"</p>
            </div>
          </div>
        </div>

        {/* Overall Progress Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            className="rounded-lg shadow-sm border p-6"
            style={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))' 
            }}
          >
            <div className="flex items-center">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Courses</p>
                <p className="text-2xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>{enrolledCourses.length}</p>
              </div>
            </div>
          </div>

          <div 
            className="rounded-lg shadow-sm border p-6"
            style={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))' 
            }}
          >
            <div className="flex items-center">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Average Progress</p>
                <p className="text-2xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
                  {calculateAverageProgress()}%
                </p>
              </div>
            </div>
          </div>

          <div 
            className="rounded-lg shadow-sm border p-6"
            style={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))' 
            }}
          >
            <div className="flex items-center">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Completed Assignments</p>
                <p className="text-2xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
                  {calculateTotalCompleted()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Goals Section */}
        <div 
          className="rounded-lg shadow-sm border p-6 mb-8"
          style={{ 
            backgroundColor: 'hsl(var(--card))', 
            borderColor: 'hsl(var(--border))' 
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>Academic Goals</h3>
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-3 py-1 rounded-lg transition-colors text-sm"
              style={{ 
                backgroundColor: 'hsl(var(--primary))', 
                color: 'hsl(var(--primary-foreground))' 
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
              }}
            >
              + Add Goal
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {goals.map(goal => (
              <div 
                key={goal.id} 
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: goal.completed ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
                  borderColor: goal.completed ? 'hsl(var(--accent-foreground))' : 'hsl(var(--border))'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="mt-1 w-4 h-4 rounded border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: goal.completed ? 'hsl(var(--primary))' : 'transparent',
                        borderColor: goal.completed ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        color: goal.completed ? 'hsl(var(--primary-foreground))' : 'transparent'
                      }}
                    >
                      {goal.completed && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <p 
                        className={`text-sm ${goal.completed ? 'line-through' : ''}`}
                        style={{ 
                          color: goal.completed ? 'hsl(var(--muted-foreground))' : 'hsl(var(--card-foreground))' 
                        }}
                      >
                        {goal.text}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-sm transition-colors"
                    style={{ color: 'hsl(var(--destructive))' }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '1';
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {goals.length === 0 && (
              <p className="text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No goals set yet. Add your first goal!</p>
            )}
          </div>
        </div>

        {/* Study Streak and Handout Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Study Streak */}
          <div 
            className="rounded-lg shadow-sm border p-6"
            style={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))' 
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🔥</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Study Streak</h3>
              <p className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>{studyStreak} days</p>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Keep it up! You're on fire!</p>
            </div>
          </div>

          {/* Handout Contributions */}
          <div 
            className="rounded-lg shadow-sm border p-6"
            style={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))' 
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Handout Contributions</h3>
              <p className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>
                {handoutCount}
              </p>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Approved uploads</p>
              <div className="mt-3">
                <div className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Next badge: {handoutCount === 0 ? '1 upload' : 
                    handoutCount < 5 ? `${5 - handoutCount} more uploads` :
                    handoutCount < 10 ? `${10 - handoutCount} more uploads` :
                    handoutCount < 20 ? `${20 - handoutCount} more uploads` :
                    handoutCount < 50 ? `${50 - handoutCount} more uploads` :
                    'Legend status!'}
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      backgroundColor: 'hsl(var(--primary))',
                      width: `${Math.min(100, handoutCount >= 50 ? 100 : handoutCount >= 20 ? 80 : handoutCount >= 10 ? 60 : handoutCount >= 5 ? 40 : handoutCount >= 1 ? 20 : 0)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Course Progress Cards */}
        <div 
          className="rounded-lg shadow-sm border p-6"
          style={{ 
            backgroundColor: 'hsl(var(--card))', 
            borderColor: 'hsl(var(--border))' 
          }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'hsl(var(--card-foreground))' }}>Course Progress</h2>
          
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <div 
                className="p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>No Enrolled Courses</h3>
              <p className="mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                You haven't enrolled in any courses yet. Start by enrolling in courses to track your progress.
              </p>
              <a 
                href="/course-selection" 
                className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'hsl(var(--primary-foreground))' 
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Enroll in Courses
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {enrolledCourses.map((course) => (
                <div 
                  key={course.id} 
                  className="border rounded-lg p-6 transition-shadow"
                  style={{ 
                    borderColor: 'hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>{course.course_code} - {course.course_name}</h3>
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Semester: {course.semester}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {course.grade && (
                        <div 
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={getGradeColor(course.grade)}
                        >
                          {course.grade}
                        </div>
                      )}
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={getProgressColor(course.progress || 0)}
                      >
                        {course.progress || 0}% Complete
                      </div>
                      <a
                        href={`/course/${course.course_code}`}
                        className="px-3 py-1 rounded-lg transition-colors text-sm inline-block text-center"
                        style={{ 
                          backgroundColor: 'hsl(var(--accent))', 
                          color: 'hsl(var(--accent-foreground))' 
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = '1';
                        }}
                      >
                        View Course
                      </a>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>Progress (Handouts Accessed)</span>
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{courseStats[course.course_code]?.progress || 0}% ({courseStats[course.course_code]?.handoutsAccessed || 0}/{courseStats[course.course_code]?.totalLectures || 0})</span>
                    </div>
                    <a href={`/course/${course.course_code}`} className="block w-full rounded-full h-3 cursor-pointer" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ 
                          backgroundColor: (courseStats[course.course_code]?.progress || 0) >= 80 ? 'hsl(var(--primary))' : 
                                          (courseStats[course.course_code]?.progress || 0) >= 60 ? 'hsl(var(--secondary))' : 'hsl(var(--destructive))',
                          width: `${courseStats[course.course_code]?.progress || 0}%`
                        }}
                      ></div>
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</span>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Credits: {course.credits}</span>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                    <div className="text-center">
                      <p className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>{course.completed_assignments || 0}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Assignments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>{courseStats[course.course_code]?.studyHours || 0}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Study Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>{courseStats[course.course_code]?.quizAttempts || 0}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>AI Quizzes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Load career content based on selected path and timeline
  const loadCareerContent = async (careerPath, timeline) => {
    setLoadingCareerContent(true);
    try {
      const { data, error } = await supabase
        .from('career_development_content')
        .select('*')
        .eq('career_path', careerPath)
        .eq('timeline', timeline)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading career content:', error);
        setCareerContent(null);
      } else {
        setCareerContent(data);
      }
    } catch (error) {
      console.error('Error loading career content:', error);
      setCareerContent(null);
    } finally {
      setLoadingCareerContent(false);
    }
  };

  // Handle career path selection
  const handleCareerPathSelect = (path) => {
    setSelectedCareerPath(path);
    setSelectedTimeline(null);
    setCareerContent(null);
  };

  // Handle timeline selection
  const handleTimelineSelect = (timeline) => {
    setSelectedTimeline(timeline);
    if (selectedCareerPath) {
      loadCareerContent(selectedCareerPath, timeline);
    }
  };

  const CareerSection = () => {
    const careerPaths = [
      {
        id: 'ethical-hacking',
        name: 'Ethical Hacking',
        icon: '🛡️',
        description: 'Learn cybersecurity through ethical hacking techniques and penetration testing',
        color: 'from-red-500 to-pink-500'
      },
      {
        id: 'ai-ml',
        name: 'AI/ML',
        icon: '🤖',
        description: 'Master artificial intelligence and machine learning technologies',
        color: 'from-blue-500 to-purple-500'
      },
      {
        id: 'cyber-security',
        name: 'Cyber Security',
        icon: '🔒',
        description: 'Protect systems and networks from digital attacks and threats',
        color: 'from-green-500 to-teal-500'
      }
    ];

    const timelines = [
      {
        id: 'start',
        name: 'Start (4 Years)',
        description: 'Just started university - Build foundational knowledge',
        duration: '4 years',
        icon: '🌱'
      },
      {
        id: 'middle',
        name: 'Middle (2 Years)',
        description: 'In the middle of semesters - Develop specialized skills',
        duration: '2 years',
        icon: '📈'
      },
      {
        id: 'end',
        name: 'End (1 Year)',
        description: 'Last semester - Prepare for professional career',
        duration: '1 year',
        icon: '🎯'
      }
    ];

    return (
      <div>
        {/* Motivational Quote */}
        <div 
          className="rounded-lg p-6 mb-8 border-l-4"
          style={{
            background: 'linear-gradient(to right, hsl(var(--muted)), hsl(var(--accent)))',
            borderLeftColor: 'hsl(var(--primary))'
          }}
        >
          <div className="flex items-start">
            <div 
              className="p-2 rounded-lg mr-4"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Career Development Journey</p>
              <p className="italic" style={{ color: 'hsl(var(--muted-foreground))' }}>"{selectedQuotes.career || 'Choose your path and timeline to begin your career development journey.'}"</p>
            </div>
          </div>
        </div>

        {!selectedCareerPath ? (
          /* Career Path Selection */
          <div 
            className="rounded-lg shadow-sm border p-8"
            style={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))'
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Choose Your Career Path</h2>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>Select the field you want to specialize in during your university journey</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {careerPaths.map((path) => (
                <div
                  key={path.id}
                  onClick={() => handleCareerPathSelect(path.id)}
                  className="cursor-pointer group hover:scale-105 transition-all duration-300"
                >
                  <div 
                    className="border-2 rounded-xl p-6 hover:shadow-lg transition-all"
                    style={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    }}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${path.color} rounded-full flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                      {path.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>{path.name}</h3>
                    <p className="text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{path.description}</p>
                    <div className="mt-4 text-center">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: 'hsl(var(--muted))',
                          color: 'hsl(var(--muted-foreground))'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'hsl(var(--accent))';
                          e.target.style.color = 'hsl(var(--accent-foreground))';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'hsl(var(--muted))';
                          e.target.style.color = 'hsl(var(--muted-foreground))';
                        }}
                      >
                        Select Path
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !selectedTimeline ? (
          /* Timeline Selection */
          <div 
            className="rounded-lg shadow-sm border p-8"
            style={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))'
            }}
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <button
                  onClick={() => handleCareerPathSelect(null)}
                  className="mr-4 p-2 rounded-lg transition-colors"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'hsl(var(--card-foreground))';
                    e.target.style.backgroundColor = 'hsl(var(--muted))';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'hsl(var(--muted-foreground))';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--card-foreground))' }}>Choose Your Timeline</h2>
              </div>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>Selected: <span className="font-semibold">{careerPaths.find(p => p.id === selectedCareerPath)?.name}</span></p>
              <p className="mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>How much time do you have left in your university journey?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {timelines.map((timeline) => (
                <div
                  key={timeline.id}
                  onClick={() => handleTimelineSelect(timeline.id)}
                  className="cursor-pointer group hover:scale-105 transition-all duration-300"
                >
                  <div 
                    className="border-2 rounded-xl p-6 transition-all"
                    style={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="text-4xl text-center mb-4 group-hover:scale-110 transition-transform">
                      {timeline.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>{timeline.name}</h3>
                    <p className="text-center text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{timeline.description}</p>
                    <div className="text-center">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: 'hsl(var(--primary) / 0.1)',
                          color: 'hsl(var(--primary))'
                        }}
                      >
                        {timeline.duration}
                      </span>
                    </div>
                    <div className="mt-4 text-center">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: 'hsl(var(--muted))',
                          color: 'hsl(var(--muted-foreground))'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'hsl(var(--accent))';
                          e.target.style.color = 'hsl(var(--accent-foreground))';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'hsl(var(--muted))';
                          e.target.style.color = 'hsl(var(--muted-foreground))';
                        }}
                      >
                        Select Timeline
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Career Content Display */
          <div>
            {/* Header with selections */}
            <div 
              className="rounded-lg shadow-sm border p-6 mb-6"
              style={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleTimelineSelect(null)}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'hsl(var(--card-foreground))';
                      e.target.style.backgroundColor = 'hsl(var(--muted))';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'hsl(var(--muted-foreground))';
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--card-foreground))' }}>
                      {careerPaths.find(p => p.id === selectedCareerPath)?.name} - {timelines.find(t => t.id === selectedTimeline)?.name}
                    </h2>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{timelines.find(t => t.id === selectedTimeline)?.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{careerPaths.find(p => p.id === selectedCareerPath)?.icon}</span>
                  <span className="text-2xl">{timelines.find(t => t.id === selectedTimeline)?.icon}</span>
                </div>
              </div>
            </div>

            {loadingCareerContent ? (
              <div 
                className="rounded-lg shadow-sm border p-12 text-center"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))'
                }}
              >
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                  style={{ borderBottomColor: 'hsl(var(--primary))' }}
                ></div>
                <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading career development content...</p>
              </div>
            ) : careerContent ? (
              <div className="space-y-6">
                {/* Instructions Section */}
                <div 
                  className="rounded-lg shadow-sm border p-6"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'hsl(var(--card-foreground))' }}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Instructions
                  </h3>
                  <div className="prose max-w-none" style={{ color: 'hsl(var(--card-foreground))' }}>
                    {careerContent.instructions ? (
                      <div dangerouslySetInnerHTML={{ __html: careerContent.instructions }} />
                    ) : (
                      <p className="italic" style={{ color: 'hsl(var(--muted-foreground))' }}>No instructions available. Contact admin to add content.</p>
                    )}
                  </div>
                </div>

                {/* Steps Section */}
                <div 
                  className="rounded-lg shadow-sm border p-6"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'hsl(var(--card-foreground))' }}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Action Steps
                  </h3>
                  <div className="prose max-w-none" style={{ color: 'hsl(var(--card-foreground))' }}>
                    {careerContent.steps ? (
                      <div dangerouslySetInnerHTML={{ __html: careerContent.steps }} />
                    ) : (
                      <p className="italic" style={{ color: 'hsl(var(--muted-foreground))' }}>No steps available. Contact admin to add content.</p>
                    )}
                  </div>
                </div>

                {/* Video Section */}
                <div 
                  className="rounded-lg shadow-sm border p-6"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'hsl(var(--card-foreground))' }}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V8a2 2 0 012-2h2a2 2 0 012 2v2" />
                    </svg>
                    Learning Resources
                  </h3>
                  {careerContent.video_url ? (
                    <div className="aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <iframe
                        src={careerContent.video_url}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title="Career Development Video"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V8a2 2 0 012-2h2a2 2 0 012 2v2" />
                        </svg>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>No video available</p>
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Contact admin to add learning resources</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div 
                className="rounded-lg shadow-sm border p-12 text-center"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))'
                }}
              >
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Content Coming Soon</h3>
                <p className="mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Career development content for {careerPaths.find(p => p.id === selectedCareerPath)?.name} - {timelines.find(t => t.id === selectedTimeline)?.name} is being prepared.
                </p>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Contact your administrator to add content for this career path and timeline.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout currentPage="/progress">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Progress Tracking</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Monitor your academic and career development journey.</p>
        </div>

        {/* Section Tabs */}
        <div 
          className="rounded-lg shadow-sm border p-2 mb-8"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))'
          }}
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveSection('academic')}
              className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: activeSection === 'academic' ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                color: activeSection === 'academic' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'academic') {
                  e.target.style.color = 'hsl(var(--card-foreground))';
                  e.target.style.backgroundColor = 'hsl(var(--muted))';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'academic') {
                  e.target.style.color = 'hsl(var(--muted-foreground))';
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Academic Progress</span>
              </div>
            </button>
            <button
              onClick={() => setActiveSection('career')}
              className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: activeSection === 'career' ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                color: activeSection === 'career' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'career') {
                  e.target.style.color = 'hsl(var(--card-foreground))';
                  e.target.style.backgroundColor = 'hsl(var(--muted))';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'career') {
                  e.target.style.color = 'hsl(var(--muted-foreground))';
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                <span>Career Development (4Y)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Conditional Content Rendering */}
        {activeSection === 'academic' ? <AcademicSection /> : <CareerSection />}

        {/* Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="rounded-lg p-6 max-w-md w-full mx-4"
              style={{ backgroundColor: 'hsl(var(--card))' }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Add New Goal</h3>
              <textarea
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Enter your academic goal..."
                className="w-full h-24 p-3 rounded-lg resize-none focus:ring-2 focus:border-transparent"
                style={{
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))'
                }}
                onFocus={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 2px hsl(var(--primary))';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    backgroundColor: 'hsl(var(--muted))'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'hsl(var(--muted) / 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'hsl(var(--muted))';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addGoal}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'hsl(var(--primary) / 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'hsl(var(--primary))';
                  }}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Achievements modal removed - see achievements-backup.js */}
      </div>
    </DashboardLayout>
  );
}