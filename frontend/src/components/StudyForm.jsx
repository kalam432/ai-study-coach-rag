import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { studyApi } from '../api/studyApi';
import { BookOpen, Clock, Target, FileText, Plus } from 'lucide-react';

const StudyForm = ({ onSessionAdded }) => {
  const { userId, addSession, setError, setLoading } = useUser();
  const [formData, setFormData] = useState({
    subject: '',
    duration: '',
    score: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'History', 'Geography', 'Computer Science', 'Economics', 'Psychology'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectSelect = (subject) => {
    setFormData(prev => ({
      ...prev,
      subject
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('Please create a user profile first');
      return;
    }

    if (!formData.subject || !formData.duration) {
      setError('Subject and duration are required');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const sessionData = {
        userId,
        subject: formData.subject,
        duration: parseInt(formData.duration),
        score: formData.score ? parseInt(formData.score) : null,
        notes: formData.notes || null,
      };

      const response = await studyApi.logStudySession(sessionData);
      
      // Add session to local state
      const newSession = {
        id: response.data.sessionId,
        ...sessionData,
        timestamp: new Date().toISOString(),
      };
      
      addSession(newSession);

      // Reset form
      setFormData({
        subject: '',
        duration: '',
        score: '',
        notes: '',
      });

      // Notify parent component
      if (onSessionAdded) {
        onSessionAdded(newSession);
      }

      console.log('✅ Study session logged successfully');
    } catch (error) {
      console.error('❌ Error logging study session:', error);
      setError(error.message || 'Failed to log study session');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Log Study Session
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your learning progress
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <BookOpen className="w-4 h-4 inline mr-2" />
            Subject
          </label>
          <div className="space-y-3">
            {/* Quick select buttons */}
            <div className="flex flex-wrap gap-2">
              {commonSubjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleSubjectSelect(subject)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                    formData.subject === subject
                      ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            {/* Custom input */}
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Or type a custom subject..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>
        </div>

        {/* Duration and Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="e.g., 60"
              min="1"
              max="1440"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Score (optional)
            </label>
            <input
              type="number"
              name="score"
              value={formData.score}
              onChange={handleInputChange}
              placeholder="e.g., 85"
              min="0"
              max="100"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Notes (optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="What did you study? Any difficulties or insights?"
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.subject || !formData.duration}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Logging Session...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Log Study Session</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default StudyForm;