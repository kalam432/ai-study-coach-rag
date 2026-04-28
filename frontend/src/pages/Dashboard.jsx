import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { studyApi } from '../api/studyApi';
import StudyForm from '../components/StudyForm';
import PerformanceCard from '../components/PerformanceCard';
import SessionList from '../components/SessionList';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Target,
  Zap,
  Calendar,
  Award
} from 'lucide-react';

const Dashboard = () => {
  const { 
    user, 
    userId, 
    sessions, 
    performance, 
    setPerformance, 
    setError,
    setSessions 
  } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch performance data
      const perfResponse = await studyApi.getPerformanceSummary(userId);
      setPerformance(perfResponse.data);

      // Fetch recent sessions
      const sessionsResponse = await studyApi.getStudySessions(userId, { limit: 10 });
      setSessions(sessionsResponse.data || []);

      // Get AI analysis if user has sessions
      if (sessionsResponse.data && sessionsResponse.data.length > 0) {
        fetchAISummary();
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISummary = async () => {
    if (!userId) return;

    setLoadingAI(true);
    try {
      const response = await studyApi.analyzePerformance(userId);
      setAiSummary(response.data.analysis);
    } catch (error) {
      console.error('❌ Error fetching AI summary:', error);
      // Don't show error for AI summary failure
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSessionAdded = () => {
    // Refresh data when new session is added
    fetchData();
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    if (!performance || performance.totalSessions === 0) {
      return "Ready to start your learning journey? Log your first study session!";
    }
    
    if (performance.totalSessions < 5) {
      return "Great start! Keep logging sessions to unlock personalized insights.";
    }
    
    const avgScore = performance.subjectMetrics
      .filter(s => s.average_score !== null)
      .reduce((sum, s) => sum + s.average_score, 0) / 
      performance.subjectMetrics.filter(s => s.average_score !== null).length;
    
    if (avgScore >= 85) {
      return "Excellent work! You're performing at a high level across subjects.";
    } else if (avgScore >= 70) {
      return "Good progress! Focus on your weak areas to reach the next level.";
    } else {
      return "Every expert was once a beginner. Keep studying and you'll improve!";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              {getMotivationalMessage()}
            </p>
          </div>
          
          {performance && performance.totalSessions > 0 && (
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {performance.totalSessions}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatTime(performance.totalTime)}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {performance.subjectMetrics.length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Subjects</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary Card */}
      {(aiSummary || loadingAI) && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Study Insights</h2>
                <p className="text-primary-100">Personalized analysis of your progress</p>
              </div>
            </div>
            
            {loadingAI ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing your study patterns...</span>
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <pre className="whitespace-pre-wrap text-sm text-white/90 font-sans">
                  {aiSummary}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {performance && performance.totalSessions > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Study Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performance.totalSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(performance.totalTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Subjects
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performance.subjectMetrics.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Score
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performance.subjectMetrics.length > 0 
                    ? Math.round(
                        performance.subjectMetrics
                          .filter(s => s.average_score !== null)
                          .reduce((sum, s) => sum + s.average_score, 0) / 
                        performance.subjectMetrics.filter(s => s.average_score !== null).length
                      ) + '%'
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Study Form */}
        <div className="lg:col-span-1">
          <StudyForm onSessionAdded={handleSessionAdded} />
        </div>

        {/* Right Column - Performance & Sessions */}
        <div className="lg:col-span-2 space-y-8">
          <PerformanceCard performance={performance} loading={loading} />
          <SessionList />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/chat'}
            className="flex items-center space-x-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors duration-200"
          >
            <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Chat with AI Coach</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get personalized advice</p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/analytics'}
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
          >
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">View Analytics</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Detailed performance insights</p>
            </div>
          </button>

          <button
            onClick={fetchAISummary}
            disabled={loadingAI || !userId || performance?.totalSessions === 0}
            className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Generate Study Plan</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered recommendations</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;