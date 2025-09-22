// ACHIEVEMENTS SECTION BACKUP - SAVED FOR FUTURE USE
// This file contains the complete achievements system code from the progress page
// Date saved: Current session
// Can be re-integrated later when needed

// ===== STATE VARIABLES =====
// Add these to your component state:
// const [achievements, setAchievements] = useState([]);
// const [showAllAchievements, setShowAllAchievements] = useState(false);
// const [handoutCount, setHandoutCount] = useState(0);

// ===== ACHIEVEMENTS LOADING FUNCTION =====
const loadGoalsAndAchievements = async () => {
  try {
    // Load goals (mock data for now)
    const mockGoals = [
      { id: 1, text: 'Complete CS101 with A grade', completed: false, deadline: '2024-12-31' },
      { id: 2, text: 'Maintain 3.5+ GPA this semester', completed: false, deadline: '2024-12-15' },
      { id: 3, text: 'Submit all assignments on time', completed: true, deadline: '2024-11-30' }
    ];
    setGoals(mockGoals);

    // Calculate study streak first
    const currentStreak = await calculateStudyStreak();

    // Get user's handout upload count
    let currentHandoutCount = 0;
    try {
      const { data: handouts, error } = await supabase
        .from('handouts')
        .select('id')
        .eq('uploader_id', user.id)
        .eq('status', 'approved');
      
      if (!error && handouts) {
        currentHandoutCount = handouts.length;
      }
    } catch (error) {
      console.error('Error fetching handout count:', error);
    }
    
    // Set handout count state
    setHandoutCount(currentHandoutCount);

    // Get current progress for achievements
    const avgProgress = calculateAverageProgress();
    
    // Get additional stats for new achievements
    let handoutDownloads = 0;
    let handoutLikes = 0;
    let subjectCount = 0;
    let feedbackCount = 0;
    let totalDaysUsed = 0;
    let isAmongFirst100 = false;
    let accountAge = 0;
    
    try {
      // Mock data for now - these would need proper database queries
      handoutDownloads = Math.floor(Math.random() * 20); // Mock downloads
      handoutLikes = Math.floor(Math.random() * 30); // Mock likes
      subjectCount = Math.floor(Math.random() * 5); // Mock subjects
      feedbackCount = Math.floor(Math.random() * 25); // Mock feedback count
      totalDaysUsed = Math.floor(Math.random() * 150); // Mock total days
      isAmongFirst100 = Math.random() > 0.8; // Mock pioneer status
      accountAge = Math.floor(Math.random() * 400); // Mock account age in days
    } catch (error) {
      console.error('Error fetching additional stats:', error);
    }

    // Define ALL possible achievements with earned status
    const allAchievements = [
      // Basic Handout achievements
      {
        id: 1,
        title: 'First Contributor',
        description: 'Upload your first handout',
        icon: '📄',
        category: 'handouts',
        earned: currentHandoutCount >= 1,
        requirement: 1
      },
      {
        id: 2,
        title: 'Knowledge Sharer',
        description: 'Upload 5 approved handouts',
        icon: '🤝',
        category: 'handouts',
        earned: currentHandoutCount >= 5,
        requirement: 5
      },
      {
        id: 3,
        title: 'Content Creator',
        description: 'Upload 10 approved handouts',
        icon: '⭐',
        category: 'handouts',
        earned: currentHandoutCount >= 10,
        requirement: 10
      },
      {
        id: 4,
        title: 'Study Material Master',
        description: 'Upload 20 approved handouts',
        icon: '🏆',
        category: 'handouts',
        earned: currentHandoutCount >= 20,
        requirement: 20
      },
      {
        id: 5,
        title: 'Legend Contributor',
        description: 'Upload 50 approved handouts',
        icon: '👑',
        category: 'handouts',
        earned: currentHandoutCount >= 50,
        requirement: 50
      },
      // Engagement achievements
      {
        id: 6,
        title: 'Helpful Hand',
        description: 'Upload handouts that get 10+ downloads',
        icon: '🤲',
        category: 'engagement',
        earned: handoutDownloads >= 10,
        requirement: 10
      },
      {
        id: 7,
        title: 'Popular Contributor',
        description: 'Have handouts liked by 25+ different users',
        icon: '🌟',
        category: 'engagement',
        earned: handoutLikes >= 25,
        requirement: 25
      },
      {
        id: 8,
        title: 'Subject Expert',
        description: 'Upload 5+ handouts for the same course',
        icon: '🎓',
        category: 'engagement',
        earned: currentHandoutCount >= 5, // Simplified for now
        requirement: 5
      },
      {
        id: 9,
        title: 'Versatile Helper',
        description: 'Upload handouts across 3+ different subjects',
        icon: '🔄',
        category: 'engagement',
        earned: subjectCount >= 3,
        requirement: 3
      },
      {
        id: 10,
        title: 'Feedback Champion',
        description: 'Rate/review 20+ handouts',
        icon: '📝',
        category: 'engagement',
        earned: feedbackCount >= 20,
        requirement: 20
      },
      // Course achievements
      {
        id: 11,
        title: 'Course Collector',
        description: 'Enroll in 5+ courses',
        icon: '📚',
        category: 'enrollment',
        earned: enrolledCourses.length >= 5,
        requirement: 5
      },
      // Study streak achievements
      {
        id: 12,
        title: 'Getting Started',
        description: 'Start your study journey',
        icon: '🚀',
        category: 'streak',
        earned: currentStreak >= 1,
        requirement: 1
      },
      {
        id: 13,
        title: 'Week Warrior',
        description: '7-day study streak',
        icon: '🔥',
        category: 'streak',
        earned: currentStreak >= 7,
        requirement: 7
      },
      {
        id: 14,
        title: 'Monthly Master',
        description: '30-day study streak',
        icon: '💪',
        category: 'streak',
        earned: currentStreak >= 30,
        requirement: 30
      },
      {
        id: 15,
        title: 'Veteran',
        description: 'Use platform for 30+ consecutive days',
        icon: '🏅',
        category: 'streak',
        earned: currentStreak >= 30,
        requirement: 30
      },
      // Milestone achievements
      {
        id: 16,
        title: 'Loyal User',
        description: 'Use platform for 100+ total days',
        icon: '💎',
        category: 'milestone',
        earned: totalDaysUsed >= 100,
        requirement: 100
      },
      {
        id: 17,
        title: 'Pioneer',
        description: 'Be among first 100 users to try new features',
        icon: '🚀',
        category: 'milestone',
        earned: isAmongFirst100,
        requirement: 1
      },
      {
        id: 18,
        title: 'Anniversary',
        description: 'Use platform for 1 full year',
        icon: '🎂',
        category: 'milestone',
        earned: accountAge >= 365,
        requirement: 365
      },
      // Special achievements
      {
        id: 19,
        title: 'Holiday Studier',
        description: 'Study during holiday breaks (weekends for a month)',
        icon: '🎄',
        category: 'special',
        earned: false, // Would need special weekend tracking
        requirement: 1
      },
      {
        id: 20,
        title: 'Lucky Number',
        description: 'Upload your 7th handout',
        icon: '🍀',
        category: 'special',
        earned: currentHandoutCount >= 7,
        requirement: 7
      },
      {
        id: 21,
        title: 'Bug Reporter',
        description: 'Report a valid bug that gets fixed',
        icon: '🐛',
        category: 'special',
        earned: false, // Would need bug report tracking
        requirement: 1
      },
      {
        id: 22,
        title: 'Feature Suggester',
        description: 'Suggest a feature that gets implemented',
        icon: '💡',
        category: 'special',
        earned: false, // Would need feature suggestion tracking
        requirement: 1
      },
      // Progress achievements
      {
        id: 23,
        title: 'Half Way There',
        description: 'Reached 50% average progress',
        icon: '🎯',
        category: 'progress',
        earned: avgProgress >= 50,
        requirement: 50
      },
      {
        id: 24,
        title: 'Almost There',
        description: 'Reached 75% average progress',
        icon: '🚀',
        category: 'progress',
        earned: avgProgress >= 75,
        requirement: 75
      },
      {
        id: 25,
        title: 'Excellence',
        description: 'Reached 90% average progress',
        icon: '🌟',
        category: 'progress',
        earned: avgProgress >= 90,
        requirement: 90
      },
      {
        id: 26,
        title: 'Assignment Master',
        description: 'Completed 5+ assignments',
        icon: '✅',
        category: 'assignments',
        earned: calculateTotalCompleted() >= 5,
        requirement: 5
      }
    ];
    
    setAchievements(allAchievements);
  } catch (error) {
    console.error('Error loading goals and achievements:', error);
  }
};

// ===== ACHIEVEMENTS UI COMPONENT =====
// Add this to your JSX where you want the achievements section:
/*
{/* Achievements *\/}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setShowAllAchievements(true)}
        className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
      >
        View All
      </button>
      <div className="text-sm text-gray-500">
        {achievements.filter(a => a.earned).length} / {achievements.length} earned
      </div>
    </div>
  </div>
  <div className="space-y-3 max-h-64 overflow-y-auto">
    {achievements.map(achievement => {
      const categoryColors = {
        'handouts': achievement.earned ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200',
        'engagement': achievement.earned ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200',
        'progress': achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200',
        'streak': achievement.earned ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200',
        'milestone': achievement.earned ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200',
        'special': achievement.earned ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-200',
        'assignments': achievement.earned ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200',
        'enrollment': achievement.earned ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
      };
      const bgColor = categoryColors[achievement.category] || (achievement.earned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200');
      
      return (
        <div key={achievement.id} className={`flex items-center space-x-3 p-3 rounded-lg border ${bgColor} ${!achievement.earned ? 'opacity-60' : ''}`}>
          <div className={`text-2xl ${!achievement.earned ? 'grayscale' : ''}`}>
            {achievement.earned ? achievement.icon : '🔒'}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className={`font-medium ${achievement.earned ? 'text-gray-900' : 'text-gray-600'}`}>
                {achievement.title}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 capitalize">
                  {achievement.category}
                </span>
                {achievement.earned && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    ✓ Earned
                  </span>
                )}
              </div>
            </div>
            <p className={`text-sm ${achievement.earned ? 'text-gray-600' : 'text-gray-500'}`}>
              {achievement.description}
            </p>
            {!achievement.earned && achievement.requirement && (
              <p className="text-xs text-gray-400 mt-1">
                Progress: {achievement.category === 'handouts' ? handoutCount : 
                         achievement.category === 'streak' ? studyStreak :
                         achievement.category === 'progress' ? calculateAverageProgress() :
                         achievement.category === 'enrollment' ? enrolledCourses.length :
                         calculateTotalCompleted()} / {achievement.requirement}
              </p>
            )}
          </div>
        </div>
      );
    })}
    {achievements.length === 0 && (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-gray-500 mb-2">Loading achievements...</p>
        <p className="text-sm text-gray-400">Upload handouts, complete assignments, and maintain study streaks to earn badges!</p>
      </div>
    )}
  </div>
</div>
*/

// ===== ACHIEVEMENTS MODAL COMPONENT =====
// Add this to your JSX at the end of your component (before closing DashboardLayout):
/*
{/* All Achievements Modal *\/}
{showAllAchievements && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          All Achievements ({achievements.filter(a => a.earned).length}/{achievements.length} earned)
        </h3>
        <button
          onClick={() => setShowAllAchievements(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Achievement Categories *\/}
      <div className="space-y-6">
        {['handouts', 'engagement', 'enrollment', 'streak', 'milestone', 'special', 'progress', 'assignments'].map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          if (categoryAchievements.length === 0) return null;
          
          const categoryNames = {
            'handouts': 'Handout Uploads',
            'engagement': 'Community Engagement',
            'enrollment': 'Course Enrollment',
            'streak': 'Study Streaks',
            'milestone': 'Platform Milestones',
            'special': 'Special Achievements',
            'progress': 'Academic Progress',
            'assignments': 'Assignment Completion'
          };
          
          const categoryColors = {
            'handouts': 'bg-blue-100 text-blue-800',
            'engagement': 'bg-purple-100 text-purple-800',
            'enrollment': 'bg-indigo-100 text-indigo-800',
            'streak': 'bg-orange-100 text-orange-800',
            'milestone': 'bg-green-100 text-green-800',
            'special': 'bg-pink-100 text-pink-800',
            'progress': 'bg-yellow-100 text-yellow-800',
            'assignments': 'bg-red-100 text-red-800'
          };
          
          return (
            <div key={category} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{categoryNames[category]}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[category]}`}>
                  {categoryAchievements.filter(a => a.earned).length}/{categoryAchievements.length} earned
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryAchievements.map(achievement => {
                  const bgColor = achievement.earned ? 'bg-white border-green-200' : 'bg-gray-100 border-gray-200';
                  
                  return (
                    <div key={achievement.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${bgColor} ${!achievement.earned ? 'opacity-70' : ''}`}>
                      <div className={`text-3xl ${!achievement.earned ? 'grayscale' : ''}`}>
                        {achievement.earned ? achievement.icon : '🔒'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-medium ${achievement.earned ? 'text-gray-900' : 'text-gray-600'}`}>
                            {achievement.title}
                          </p>
                          {achievement.earned && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              ✓ Earned
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${achievement.earned ? 'text-gray-600' : 'text-gray-500'} mb-2`}>
                          {achievement.description}
                        </p>
                        {!achievement.earned && achievement.requirement && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-400">
                              Progress: {achievement.category === 'handouts' ? handoutCount : 
                                       achievement.category === 'streak' ? studyStreak :
                                       achievement.category === 'progress' ? calculateAverageProgress() :
                                       achievement.category === 'enrollment' ? enrolledCourses.length :
                                       calculateTotalCompleted()} / {achievement.requirement}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(100, ((achievement.category === 'handouts' ? handoutCount : 
                                           achievement.category === 'streak' ? studyStreak :
                                           achievement.category === 'progress' ? calculateAverageProgress() :
                                           achievement.category === 'enrollment' ? enrolledCourses.length :
                                           calculateTotalCompleted()) / achievement.requirement) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowAllAchievements(false)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
*/

// ===== USAGE INSTRUCTIONS =====
/*
To re-integrate this achievements system:

1. Add the state variables to your component
2. Add the loadGoalsAndAchievements function
3. Call loadGoalsAndAchievements() in your useEffect
4. Add the achievements UI component to your JSX
5. Add the achievements modal component to your JSX
6. Make sure you have the required helper functions:
   - calculateStudyStreak()
   - calculateAverageProgress()
   - calculateTotalCompleted()

Note: Some achievements use mock data and would need proper database integration for full functionality.
*/