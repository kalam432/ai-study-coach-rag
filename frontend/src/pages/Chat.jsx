import React from 'react';
import ChatBox from '../components/ChatBox';
import { Brain, MessageCircle, Zap, Target } from 'lucide-react';

const Chat = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Get intelligent insights based on your study patterns and performance data'
    },
    {
      icon: Target,
      title: 'Personalized Plans',
      description: 'Receive custom study schedules tailored to your weak areas and goals'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Ask questions and get immediate, contextual responses about your learning'
    },
    {
      icon: MessageCircle,
      title: 'Natural Conversation',
      description: 'Chat naturally about your studies, challenges, and learning objectives'
    }
  ];

  const sampleQuestions = [
    "Analyze my performance in Mathematics",
    "Create a study plan for this week",
    "What are my weakest subjects?",
    "How can I improve my study efficiency?",
    "Generate a revision schedule for my exams",
    "What study techniques work best for me?"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Study Coach
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your personal AI-powered learning assistant. Get personalized study plans, 
          performance insights, and expert guidance based on your unique learning patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <ChatBox />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              What I Can Help With
            </h3>
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Questions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Try Asking Me
            </h3>
            <div className="space-y-2">
              {sampleQuestions.map((question, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  onClick={() => {
                    // You could implement auto-filling the chat input here
                    console.log('Sample question clicked:', question);
                  }}
                >
                  "{question}"
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6">
            <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-4">
              💡 Pro Tips
            </h3>
            <div className="space-y-3 text-sm text-primary-800 dark:text-primary-200">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Be specific about your subjects and challenges for better recommendations</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Ask for study plans with specific time frames (daily, weekly)</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Request analysis of your performance trends and patterns</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>The more study sessions you log, the better my recommendations become</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;