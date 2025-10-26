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
  const [currentSemester, setCurrentSemester] = useState(1);
  const [completedSteps, setCompletedSteps] = useState({});
  const [completedActionSteps, setCompletedActionSteps] = useState({});

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
            <p className="mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading your academic progress...</p>
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

    // For Cyber Security, skip timeline selection and show roadmap directly
    if (path === 'cyber-security') {
      setSelectedTimeline('roadmap');
      setCareerContent(getCyberSecurityRoadmap());
    }
  };

  // Get the comprehensive cyber security roadmap
  const getCyberSecurityRoadmap = () => {
    return {
      title: "Complete Cyber Security Roadmap",
      description: "7-semester journey from web development fundamentals to cybersecurity expertise",
      semesters: [
        {
          semester: 1,
          title: "Grasp University & Programming Basics",
          instruction: "Learn how university works and intro to programming/web dev (2-4 hours/day)",
          actionSteps: [
            "Study university system: Review schedules, policies, resources to navigate efficiently",
            "Learn programming basics: Understand code, logic, and problem-solving concepts",
            "Explore web dev: Research careers, tools, and fundamentals of web development"
          ],
          skills: ["University Navigation", "Basic Programming", "Web Development Basics", "Problem Solving"],
          deliverables: ["University orientation completion", "First programming exercise", "Basic web research report"]
        },
        {
          semester: 2,
          title: "Core Web & Programming Skills",
          instruction: "Master HTML, CSS, GitHub, C++ basics; push 3-4 projects to GitHub",
          actionSteps: [
            "Learn HTML/CSS: Build and style basic web pages",
            "Use GitHub: Set up account, learn version control, host projects",
            "Study C++ basics: Grasp programming fundamentals via C++",
            "Build projects: Create 3-4 small web projects, upload to GitHub"
          ],
          skills: ["HTML/CSS", "GitHub", "C++ Fundamentals", "Version Control", "Project Management"],
          deliverables: ["3-4 web projects on GitHub", "C++ programming assignments", "Personal GitHub profile"]
        },
        {
          semester: 3,
          title: "Advanced Web & CS Foundations",
          instruction: "Learn JS, React, and CS301 (Data Structures), CS304 (OOP); build 3 frontend projects",
          actionSteps: [
            "Master JS/React: Create interactive web apps with JavaScript and React",
            "Study Data Structures/OOP: Learn algorithms, data organization, and object-oriented principles",
            "Build frontend projects: Develop 3 projects using HTML, CSS, JS/React"
          ],
          skills: ["JavaScript", "React", "Data Structures", "OOP", "Frontend Development", "Algorithms"],
          deliverables: ["3 interactive React projects", "Data structures implementations", "OOP project portfolio"]
        },
        {
          semester: 4,
          title: "Backend & Cybersecurity Basics",
          instruction: "Learn Mongoose, Tailwind, CS604 (OS), CS610 (Networks); practice CLI on Linux VM",
          actionSteps: [
            "Learn Mongoose: Manage databases for backend development",
            "Use Tailwind: Style websites efficiently with Tailwind CSS",
            "Study OS/Networks: Understand operating systems and networking for cybersecurity",
            "Practice CLI: Install Ubuntu/Kali Linux VM, master command line basics"
          ],
          skills: ["Mongoose", "Tailwind CSS", "Operating Systems", "Networking", "Linux CLI", "Virtual Machines"],
          deliverables: ["Database-driven web app", "Linux VM setup", "Network configuration project", "CLI automation scripts"]
        },
        {
          semester: 5,
          title: "Portfolio & Professional Networking",
          instruction: "Build portfolio, start LinkedIn, study CS401 (Assembly), network",
          actionSteps: [
            "Create portfolio: Showcase projects on a personal website",
            "Set up LinkedIn: Profile as Full Stack Developer, apply for internships",
            "Study Assembly: Learn low-level programming for cybersecurity edge",
            "Network: Connect with peers, professionals for opportunities"
          ],
          skills: ["Portfolio Development", "Professional Networking", "Assembly Language", "LinkedIn Optimization", "Career Planning"],
          deliverables: ["Professional portfolio website", "Optimized LinkedIn profile", "Assembly programming projects", "5+ professional connections"]
        },
        {
          semester: 6,
          title: "Full-Stack & Cybersecurity Tools",
          instruction: "Learn Next.js, Framer Motion, ShadCN, Linux (Kali), CS205; take certified course",
          actionSteps: [
            "Build with Next.js/Framer/ShadCN: Create modern full-stack websites",
            "Master Linux (Kali): Learn cyber tools, networking for cybersecurity",
            "Study CS205: Focus on course for technical depth",
            "Earn certification: Complete a course (e.g., YouTube) for resume boost"
          ],
          skills: ["Next.js", "Framer Motion", "ShadCN", "Kali Linux", "Cybersecurity Tools", "Penetration Testing"],
          deliverables: ["Full-stack Next.js application", "Kali Linux lab setup", "Cybersecurity certification", "Penetration testing report"]
        },
        {
          semester: 7,
          title: "FYP & Cybersecurity Networking",
          instruction: "Work on FYP, network in cybersecurity, pursue internships",
          actionSteps: [
            "Complete FYP: Select and develop a strong Final Year Project",
            "Network in cybersecurity: Join communities, connect with professionals",
            "Pursue internships: Apply to gain industry experience, assess market demands"
          ],
          skills: ["Project Management", "Research & Development", "Industry Networking", "Internship Applications", "Professional Communication"],
          deliverables: ["Completed Final Year Project", "Cybersecurity community membership", "Internship applications", "Professional network of 20+ contacts"]
        }
      ],
      outcome: "Strong foundation in web development, cybersecurity, and programming, ready for career opportunities in cybersecurity field"
    };
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
        id: 'cyber-security',
        name: 'Cyber Security',
        icon: '🔒',
        description: 'Complete roadmap from web development to cybersecurity expertise',
        color: 'from-green-500 to-teal-500',
        available: true
      },
      {
        id: 'ethical-hacking',
        name: 'Ethical Hacking',
        icon: '🛡️',
        description: 'Advanced penetration testing and ethical hacking techniques',
        color: 'from-red-500 to-pink-500',
        available: false,
        comingSoon: true
      },
      {
        id: 'ai-ml',
        name: 'AI/ML',
        icon: '🤖',
        description: 'Artificial intelligence and machine learning specialization',
        color: 'from-blue-500 to-purple-500',
        available: false,
        comingSoon: true
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
                  onClick={() => path.available ? handleCareerPathSelect(path.id) : null}
                  className={`group transition-all duration-300 ${path.available ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                >
                  <div
                    className={`border-2 rounded-xl p-6 transition-all ${path.available ? 'hover:shadow-lg' : ''}`}
                    style={{
                      backgroundColor: path.available ? 'hsl(var(--card))' : 'hsl(var(--muted))',
                      borderColor: 'hsl(var(--border))',
                      opacity: path.available ? 1 : 0.6,
                      filter: path.available ? 'none' : 'grayscale(100%)'
                    }}
                    onMouseEnter={(e) => {
                      if (path.available) {
                        e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (path.available) {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      }
                    }}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${path.color} rounded-full flex items-center justify-center text-2xl mb-4 mx-auto ${path.available ? 'group-hover:scale-110' : ''} transition-transform`}>
                      {path.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>{path.name}</h3>
                    <p className="text-center text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{path.description}</p>

                    {path.comingSoon && (
                      <div className="mb-3 text-center">
                        <div
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: 'hsl(var(--warning) / 0.1)',
                            color: 'hsl(var(--warning))',
                            border: '1px solid hsl(var(--warning) / 0.3)'
                          }}
                        >
                          🚧 Coming Soon
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          We're working hard to bring you this specialization track. Stay tuned!
                        </p>
                      </div>
                    )}

                    <div className="mt-4 text-center">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: path.available ? 'hsl(var(--muted))' : 'hsl(var(--muted) / 0.5)',
                          color: path.available ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground) / 0.7)'
                        }}
                        onMouseEnter={(e) => {
                          if (path.available) {
                            e.target.style.backgroundColor = 'hsl(var(--accent))';
                            e.target.style.color = 'hsl(var(--accent-foreground))';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (path.available) {
                            e.target.style.backgroundColor = 'hsl(var(--muted))';
                            e.target.style.color = 'hsl(var(--muted-foreground))';
                          }
                        }}
                      >
                        {path.available ? 'Start Journey' : 'Coming Soon'}
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
            ) : careerContent && selectedCareerPath === 'cyber-security' ? (
              <div className="space-y-6">
                {/* Roadmap Overview */}
                <div
                  className="rounded-lg shadow-sm border p-6"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">🛡️</div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>{careerContent.title}</h2>
                    <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>{careerContent.description}</p>
                  </div>

                  {/* Introductory Video Section */}
                  <div
                    className="rounded-lg shadow-sm border p-6 mb-6"
                    style={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))'
                    }}
                  >
                    <div className="flex items-center mb-4">
                      <div
                        className="p-2 rounded-lg mr-3"
                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
                        🎥 Roadmap Overview Video
                      </h3>
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        title="Cyber Security Roadmap Overview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                    <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <p className="mb-2">
                        📺 <strong>Watch this overview</strong> to understand the complete 7-semester journey from web development to cybersecurity expertise.
                      </p>
                      <p>
                        ⏱️ <strong>Duration:</strong> 15 minutes |
                        🎯 <strong>Topics:</strong> Career path overview, semester breakdown, key milestones, and success tips
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}
                  >
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>Expected Outcome</h3>
                    </div>
                    <p style={{ color: 'hsl(var(--card-foreground))' }}>{careerContent.outcome}</p>
                  </div>
                </div>

                {/* Semester Roadmap */}
                <div className="space-y-4">
                  {careerContent.semesters.map((semester, index) => (
                    <div
                      key={semester.semester}
                      className="rounded-lg shadow-sm border p-6"
                      style={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))'
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                          >
                            {semester.semester}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
                              Semester {semester.semester}: {semester.title}
                            </h3>
                            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              ⏰ {semester.timeCommitment}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Focus Area:</h4>
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{semester.focus}</p>
                        {semester.goal && (
                          <p className="text-sm mt-1" style={{ color: 'hsl(var(--primary))' }}>
                            🎯 Goal: {semester.goal}
                          </p>
                        )}
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-3 flex items-center" style={{ color: 'hsl(var(--card-foreground))' }}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Action Steps:
                        </h4>
                        <div className="space-y-2">
                          {semester.actionSteps.map((step, stepIndex) => {
                            const stepKey = `${semester.semester}-${stepIndex}`;
                            const isCompleted = completedActionSteps[stepKey] || false;

                            return (
                              <div
                                key={stepIndex}
                                className="flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200"
                                style={{
                                  backgroundColor: isCompleted ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.3)',
                                  borderColor: isCompleted ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))'
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setCompletedActionSteps(prev => ({
                                      ...prev,
                                      [stepKey]: !prev[stepKey]
                                    }));
                                  }}
                                  className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                                  style={{
                                    backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'transparent',
                                    borderColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                    color: isCompleted ? 'hsl(var(--primary-foreground))' : 'transparent'
                                  }}
                                >
                                  {isCompleted && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <div className="flex items-start space-x-2 flex-1">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0"
                                    style={{
                                      backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                      color: 'hsl(var(--primary-foreground))'
                                    }}
                                  >
                                    {stepIndex + 1}
                                  </div>
                                  <span
                                    className={`text-sm ${isCompleted ? 'line-through' : ''}`}
                                    style={{
                                      color: isCompleted ? 'hsl(var(--muted-foreground))' : 'hsl(var(--card-foreground))'
                                    }}
                                  >
                                    {step}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Key Skills:</h4>
                          <div className="flex flex-wrap gap-1">
                            {semester.skills.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Deliverables:</h4>
                          <ul className="text-sm space-y-1">
                            {semester.deliverables.map((deliverable, delIndex) => (
                              <li key={delIndex} className="flex items-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Call to Action */}
                <div
                  className="rounded-lg shadow-sm border p-6 text-center"
                  style={{
                    backgroundColor: 'hsl(var(--primary) / 0.05)',
                    borderColor: 'hsl(var(--primary) / 0.2)'
                  }}
                >
                  <div className="text-3xl mb-3">🚀</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>Ready to Start Your Journey?</h3>
                  <p className="mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    This roadmap will guide you from web development fundamentals to cybersecurity expertise over 7 semesters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      className="px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                      style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                      onClick={() => window.location.href = '/student-services'}
                    >
                      💬 Get Support
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                      style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}
                      onClick={() => window.location.href = '/course-selection'}
                    >
                      📚 View Courses
                    </button>
                  </div>
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