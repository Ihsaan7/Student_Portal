'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AIStudyAssistant({ courseCode, user }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [studyProgress, setStudyProgress] = useState({
    mcqsCompleted: 0,
    totalMcqs: 0,
    accuracyRate: 0,
    lecturesStudied: 0,
    lastStudySession: null,
    studySessions: 0,
    totalStudyTime: 0
  });
  const [isQuizMode, setIsQuizMode] = useState(false);

  // Load study progress on component mount
  useEffect(() => {
    loadStudyProgress();
  }, [courseCode, user]);

  const loadStudyProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('study_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_code', courseCode)
        .single();

      if (data) {
        setStudyProgress(data);
      }
    } catch (error) {
      console.log('No existing progress found');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      alert('Please upload a .txt file only');
      return;
    }

    setUploadedFile(file);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      console.log('File content loaded:', content.substring(0, 100) + '...');
    };
    reader.readAsText(file);
  };

  const generateMCQs = async () => {
    if (!uploadedFile) {
      alert('Please upload a text file first');
      return;
    }

    setIsGenerating(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        
        // For now, generate sample MCQs (in real implementation, this would call an AI API)
        const sampleMCQs = generateSampleMCQs(content);
        setMcqs(sampleMCQs);
        setCurrentMcqIndex(0);
        setUserAnswers({});
        setShowResults(false);
        setIsQuizMode(true);
        
        // Update progress
        setStudyProgress(prev => ({
          ...prev,
          totalMcqs: sampleMCQs.length,
          lecturesStudied: prev.lecturesStudied + 1
        }));
      };
      reader.readAsText(uploadedFile);
    } catch (error) {
      console.error('Error generating MCQs:', error);
      alert('Error generating MCQs. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSampleMCQs = (content) => {
    // Extract meaningful content from the uploaded file
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const topics = extractTopics(content);
    const keywords = extractKeywords(content);
    const concepts = extractConcepts(content);
    
    const mcqs = [];
    
    // Generate educational/conceptual questions
    const questionTemplates = [
      {
        template: "What is the primary purpose of {concept}?",
        type: "purpose"
      },
      {
        template: "How does {concept} relate to the overall topic?",
        type: "relationship"
      },
      {
        template: "What would be the best application of {concept}?",
        type: "application"
      },
      {
        template: "Which statement best describes {concept}?",
        type: "description"
      },
      {
        template: "What is the significance of {concept} in this context?",
        type: "significance"
      },
      {
        template: "How can {concept} be implemented effectively?",
        type: "implementation"
      },
      {
        template: "What are the key benefits of understanding {concept}?",
        type: "benefits"
      },
      {
        template: "Which approach best demonstrates {concept}?",
        type: "demonstration"
      },
      {
        template: "What is the most important aspect of {concept}?",
        type: "importance"
      },
      {
        template: "How does {concept} contribute to problem-solving?",
        type: "problem-solving"
      }
    ];
    
    // Generate questions using templates and extracted content
    const allConcepts = [...topics, ...keywords, ...concepts].filter(c => c && c.length > 3);
    
    for (let i = 0; i < Math.min(10, questionTemplates.length); i++) {
      const template = questionTemplates[i];
      const concept = allConcepts[i % allConcepts.length] || 'the main concept';
      
      const question = template.template.replace('{concept}', concept.toLowerCase());
      
      // Generate educational options based on question type
      const options = generateEducationalOptions(template.type, concept, content, allConcepts);
      
      mcqs.push({
        id: i + 1,
        question: question,
        options: shuffleArray(options),
        correctAnswer: 0
      });
    }
    
    return mcqs.slice(0, 10);
  };
  
  const generateEducationalOptions = (questionType, concept, content, allConcepts) => {
    const correctOption = generateCorrectOption(questionType, concept, content);
    const distractors = generateEducationalDistractors(questionType, concept, allConcepts);
    
    return [correctOption, ...distractors.slice(0, 3)];
  };
  
  const generateCorrectOption = (questionType, concept, content) => {
    const templates = {
      purpose: [`To provide a framework for understanding ${concept}`, `To establish the foundation of ${concept}`, `To enable effective use of ${concept}`],
      relationship: [`${concept} serves as a core component`, `${concept} connects to the main principles`, `${concept} supports the overall framework`],
      application: [`Implementing ${concept} in practical scenarios`, `Using ${concept} to solve real-world problems`, `Applying ${concept} principles effectively`],
      description: [`${concept} is a fundamental principle`, `${concept} represents a key methodology`, `${concept} embodies essential concepts`],
      significance: [`${concept} plays a crucial role`, `${concept} provides essential insights`, `${concept} offers valuable perspectives`],
      implementation: [`Through systematic application of ${concept}`, `By following ${concept} guidelines`, `Using structured ${concept} approaches`],
      benefits: [`Enhanced understanding of core principles`, `Improved problem-solving capabilities`, `Better practical application skills`],
      demonstration: [`Practical examples of ${concept}`, `Real-world applications of ${concept}`, `Case studies involving ${concept}`],
      importance: [`The foundational nature of ${concept}`, `The practical value of ${concept}`, `The comprehensive scope of ${concept}`],
      "problem-solving": [`By providing systematic approaches`, `Through structured methodologies`, `By offering practical frameworks`]
    };
    
    const options = templates[questionType] || templates.purpose;
    return options[Math.floor(Math.random() * options.length)];
  };
  
  const generateEducationalDistractors = (questionType, concept, allConcepts) => {
    const genericDistractors = [
      "Through memorization techniques",
      "By avoiding complex analysis",
      "Using simplified approaches only",
      "Through theoretical study alone",
      "By focusing on basic definitions",
      "Using traditional methods exclusively",
      "Through repetitive practice only",
      "By avoiding practical applications",
      "Using outdated methodologies",
      "Through surface-level understanding"
    ];
    
    const conceptDistractors = allConcepts
      .filter(c => c !== concept)
      .map(c => `By focusing primarily on ${c.toLowerCase()}`)
      .slice(0, 5);
    
    return [...genericDistractors, ...conceptDistractors]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  };
  
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const generateDistractors = (correct, pool) => {
    const distractors = pool.filter(item => item !== correct).slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(`Alternative ${distractors.length + 1}`);
    }
    return distractors;
  };
  
  const generateWordDistractors = (word) => {
    const commonWords = ['process', 'system', 'method', 'approach', 'concept', 'principle', 'theory', 'practice', 'technique', 'strategy'];
    return commonWords.filter(w => w !== word.toLowerCase()).slice(0, 3);
  };

  const extractTopics = (content) => {
    // Enhanced topic extraction
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'this', 'that', 'will', 'can', 'have', 'has', 'been', 'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'which', 'who', 'how', 'why', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'also', 'very', 'more', 'most', 'some', 'many', 'much', 'such', 'other', 'than', 'only', 'just', 'like', 'into', 'over', 'after', 'before', 'through', 'during', 'above', 'below', 'between', 'among'];
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 4 && !commonWords.includes(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    // Get most frequent words as topics
    const topics = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    
    return topics;
  };
  
  const extractKeywords = (content) => {
    // Extract potential keywords (capitalized words, technical terms)
    const words = content.split(/\s+/);
    const keywords = [];
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      // Look for capitalized words (potential proper nouns/technical terms)
      if (cleanWord.length > 3 && /^[A-Z]/.test(cleanWord)) {
        keywords.push(cleanWord);
      }
    });
    
    // Remove duplicates and return unique keywords
    return [...new Set(keywords)].slice(0, 10);
  };
  
  const extractConcepts = (content) => {
    // Look for phrases that might indicate concepts
    const conceptPatterns = [
      /is defined as ([^.!?]+)/gi,
      /refers to ([^.!?]+)/gi,
      /means ([^.!?]+)/gi,
      /concept of ([^.!?]+)/gi,
      /principle of ([^.!?]+)/gi,
      /theory of ([^.!?]+)/gi
    ];
    
    const concepts = [];
    conceptPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const concept = match.replace(pattern, '$1').trim();
          if (concept.length > 3 && concept.length < 50) {
            concepts.push(concept);
          }
        });
      }
    });
    
    return [...new Set(concepts)].slice(0, 5);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const submitQuiz = async () => {
    const correctAnswers = mcqs.filter(mcq => userAnswers[mcq.id] === mcq.correctAnswer).length;
    const accuracyRate = Math.round((correctAnswers / mcqs.length) * 100);
    
    const newProgress = {
      ...studyProgress,
      mcqsCompleted: studyProgress.mcqsCompleted + mcqs.length,
      accuracyRate: accuracyRate,
      lastStudySession: new Date().toISOString(),
      studySessions: studyProgress.studySessions + 1,
      totalStudyTime: studyProgress.totalStudyTime + 30 // Assume 30 minutes per session
    };
    
    setStudyProgress(newProgress);
    setShowResults(true);
    
    // Save progress to database
    try {
      await supabase
        .from('study_progress')
        .upsert({
          user_id: user.id,
          course_code: courseCode,
          ...newProgress
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const resetQuiz = () => {
    setIsQuizMode(false);
    setMcqs([]);
    setUserAnswers({});
    setShowResults(false);
    setCurrentMcqIndex(0);
    setUploadedFile(null);
  };

  if (isQuizMode && mcqs.length > 0) {
    if (showResults) {
      const correctAnswers = mcqs.filter(mcq => userAnswers[mcq.id] === mcq.correctAnswer).length;
      const accuracyRate = Math.round((correctAnswers / mcqs.length) * 100);
      
      return (
        <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Quiz Results</h3>
          
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>{accuracyRate}%</div>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>You got {correctAnswers} out of {mcqs.length} questions correct!</p>
          </div>
          
          <div className="space-y-3 mb-6">
            {mcqs.map((mcq, index) => {
              const userAnswer = userAnswers[mcq.id];
              const isCorrect = userAnswer === mcq.correctAnswer;
              
              return (
                <div key={mcq.id} className="p-3 rounded-lg border" style={{
                  borderColor: isCorrect ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--destructive) / 0.3)',
                  backgroundColor: isCorrect ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--destructive) / 0.1)'
                }}>
                  <p className="font-medium text-sm mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>Q{index + 1}: {mcq.question}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Your answer: {mcq.options[userAnswer]} {isCorrect ? '✓' : '✗'}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs" style={{ color: 'hsl(var(--primary))' }}>
                      Correct: {mcq.options[mcq.correctAnswer]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          
          <button
            onClick={resetQuiz}
            className="w-full py-2 px-4 rounded-lg transition-colors"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Start New Quiz
          </button>
        </div>
      );
    }
    
    return (
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>MCQ Quiz</h3>
          <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {Object.keys(userAnswers).length}/{mcqs.length} answered
          </span>
        </div>
        
        <div className="space-y-4 mb-6">
          {mcqs.map((mcq, index) => (
            <div key={mcq.id} className="border rounded-lg p-4" style={{ borderColor: 'hsl(var(--border))' }}>
              <h4 className="font-medium mb-3" style={{ color: 'hsl(var(--card-foreground))' }}>
                Q{index + 1}: {mcq.question}
              </h4>
              
              <div className="space-y-2">
                {mcq.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${mcq.id}`}
                      value={optionIndex}
                      checked={userAnswers[mcq.id] === optionIndex}
                      onChange={() => handleAnswerSelect(mcq.id, optionIndex)}
                      className="mr-3"
                      style={{ accentColor: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm" style={{ color: 'hsl(var(--card-foreground))' }}>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={submitQuiz}
            disabled={Object.keys(userAnswers).length < mcqs.length}
            className="flex-1 py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor: Object.keys(userAnswers).length < mcqs.length ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
              color: Object.keys(userAnswers).length < mcqs.length ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))'
            }}
            onMouseEnter={(e) => {
              if (Object.keys(userAnswers).length >= mcqs.length) {
                e.target.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (Object.keys(userAnswers).length >= mcqs.length) {
                e.target.style.opacity = '1';
              }
            }}
          >
            Submit Quiz
          </button>
          <button
            onClick={resetQuiz}
            className="px-4 py-2 border rounded-lg transition-colors"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(var(--muted) / 0.5)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* AI Study Assistant */}
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'hsl(var(--card-foreground))' }}>
          <svg className="w-5 h-5 mr-2" style={{ color: 'hsl(var(--primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Study Assistant
        </h3>
        
        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
            Upload Lecture Notes (.txt)
          </label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center transition-colors" style={{ borderColor: 'hsl(var(--border))' }} onMouseEnter={(e) => e.target.style.borderColor = 'hsl(var(--primary))'} onMouseLeave={(e) => e.target.style.borderColor = 'hsl(var(--border))'}>

            <input
              type="file"
              accept=".txt"
              className="hidden"
              id="lecture-upload"
              onChange={handleFileUpload}
            />
            <label htmlFor="lecture-upload" className="cursor-pointer">
              <svg className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm" style={{ color: 'hsl(var(--card-foreground))' }}>
                {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>TXT files only</p>
            </label>
          </div>
        </div>

        {/* MCQ Generation Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>MCQ Generation</span>
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {uploadedFile ? 'Ready' : 'Upload file first'}
            </span>
          </div>
          <button
            onClick={generateMCQs}
            disabled={!uploadedFile || isGenerating}
            className="w-full py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor: (!uploadedFile || isGenerating) ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
              color: (!uploadedFile || isGenerating) ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))'
            }}
            onMouseEnter={(e) => {
              if (uploadedFile && !isGenerating) {
                e.target.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (uploadedFile && !isGenerating) {
                e.target.style.opacity = '1';
              }
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate 10 MCQs'}
          </button>
        </div>

        {/* Progress Tracking */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>Study Progress</h4>
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>MCQs Completed</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {studyProgress.mcqsCompleted}/{studyProgress.totalMcqs || 0}
            </span>
          </div>
          
          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <div 
              className="h-2 rounded-full" 
              style={{ 
                backgroundColor: 'hsl(var(--primary))',
                width: studyProgress.totalMcqs > 0 
                  ? `${(studyProgress.mcqsCompleted / studyProgress.totalMcqs) * 100}%` 
                  : '0%' 
              }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Accuracy Rate</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {studyProgress.accuracyRate || 0}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Lectures Studied</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {studyProgress.lecturesStudied}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Last Study Session</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {studyProgress.lastStudySession 
                ? new Date(studyProgress.lastStudySession).toLocaleDateString()
                : 'Never'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Overall Course Statistics */}
      <div className="rounded-xl shadow-sm border-2 p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Course Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Overall Progress</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {studyProgress.lecturesStudied > 0 ? Math.round((studyProgress.lecturesStudied / 10) * 100) : 0}%
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <div 
              className="h-2 rounded-full" 
              style={{ 
                backgroundColor: 'hsl(var(--primary))',
                width: studyProgress.lecturesStudied > 0 
                  ? `${Math.min((studyProgress.lecturesStudied / 10) * 100, 100)}%` 
                  : '0%' 
              }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Study Sessions</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {studyProgress.studySessions}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Study Time</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {Math.floor(studyProgress.totalStudyTime / 60)}h {studyProgress.totalStudyTime % 60}m
            </span>
          </div>
        </div>
      </div>
    </>
  );
}