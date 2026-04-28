import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

const PerformanceCard = ({ performance, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Performance Data
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start logging study sessions to see your performance analytics
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreIcon = (score) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return Target;
    return AlertTriangle;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Performance Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your learning analytics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Sessions
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {performance.totalSessions}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Time
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTime(performance.totalTime)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Avg Score
            </span>
          </div>
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

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Subjects
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {performance.subjectMetrics.length}
          </p>
        </div>
      </div>

      {/* Strong Subjects */}
      {performance.strongSubjects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            Strong Subjects
          </h3>
          <div className="space-y-2">
            {performance.strongSubjects.slice(0, 3).map((subject, index) => {
              const ScoreIcon = getScoreIcon(subject.average_score);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center space-x-3">
                    <ScoreIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subject.subject}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {Math.round(subject.average_score)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {subject.session_count} sessions
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak Subjects */}
      {performance.weakSubjects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            Areas for Improvement
          </h3>
          <div className="space-y-2">
            {performance.weakSubjects.slice(0, 3).map((subject, index) => {
              const ScoreIcon = getScoreIcon(subject.average_score);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center space-x-3">
                    <ScoreIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subject.subject}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {Math.round(subject.average_score)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {subject.session_count} sessions
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No data state */}
      {performance.strongSubjects.length === 0 && performance.weakSubjects.length === 0 && (
        <div className="text-center py-6">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            Add scores to your study sessions to see subject performance
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceCard;