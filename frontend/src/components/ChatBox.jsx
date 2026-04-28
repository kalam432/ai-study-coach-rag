import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { studyApi } from '../api/studyApi';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageCircle, 
  Trash2,
  BarChart3,
  AlertTriangle,
  Calendar,
  Target
} from 'lucide-react';

const ChatBox = () => {
  const { userId, chatHistory, addChatMessage, clearChat, setError } = useUser();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const quickPrompts = [
    {
      icon: BarChart3,
      text: "Analyze my performance",
      prompt: "Analyze my study performance and identify areas for improvement"
    },
    {
      icon: Calendar,
      text: "Create study plan",
      prompt: "Generate a personalized study plan for this week based on my weak areas"
    },
    {
      icon: Target,
      text: "Focus areas",
      prompt: "What subjects should I focus on to improve my overall performance?"
    },
    {
      icon: AlertTriangle,
      text: "Study tips",
      prompt: "Give me specific study tips based on my learning patterns"
    }
  ];

  const handleSendMessage = async (messageText = message) => {
    if (!messageText.trim() || !userId) return;

    const userMessage = {
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await studyApi.chatWithAI(userId, messageText.trim());
      
      const aiMessage = {
        type: 'ai',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      addChatMessage(aiMessage);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage = {
        type: 'ai',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      addChatMessage(errorMessage);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  const formatAIResponse = (content) => {
    // Split content by sections
    const sections = content.split(/(?=📊|⚠️|📅|🎯)/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      let sectionClass = 'mb-4 p-4 rounded-lg border-l-4';
      let icon = null;
      
      if (section.includes('📊')) {
        sectionClass += ' bg-blue-50 dark:bg-blue-900/20 border-blue-400';
        icon = <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      } else if (section.includes('⚠️')) {
        sectionClass += ' bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400';
        icon = <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      } else if (section.includes('📅')) {
        sectionClass += ' bg-green-50 dark:bg-green-900/20 border-green-400';
        icon = <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />;
      } else if (section.includes('🎯')) {
        sectionClass += ' bg-purple-50 dark:bg-purple-900/20 border-purple-400';
        icon = <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      } else {
        sectionClass += ' bg-gray-50 dark:bg-gray-700 border-gray-400';
      }
      
      return (
        <div key={index} className={sectionClass}>
          <div className="flex items-start space-x-2">
            {icon}
            <div className="flex-1">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200">
                {section.trim()}
              </pre>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Study Coach
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your personal learning assistant
            </p>
          </div>
        </div>
        
        {chatHistory.length > 0 && (
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Ask me anything about your study progress, get personalized plans, or request analysis
            </p>
            
            {/* Quick prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
              {quickPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    className="flex items-center space-x-2 p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {prompt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.type === 'ai' && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.type === 'user'
                      ? 'bg-primary-600 text-white'
                      : msg.isError
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {msg.type === 'ai' && !msg.isError ? (
                    <div className="text-gray-800 dark:text-gray-200">
                      {formatAIResponse(msg.content)}
                    </div>
                  ) : (
                    <p className={`text-sm ${
                      msg.type === 'user' 
                        ? 'text-white' 
                        : msg.isError 
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {msg.content}
                    </p>
                  )}
                  <p className={`text-xs mt-2 ${
                    msg.type === 'user' 
                      ? 'text-primary-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                
                {msg.type === 'user' && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-600 dark:bg-gray-500 rounded-full flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      AI thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your study progress..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isLoading || !userId}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!message.trim() || isLoading || !userId}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {!userId && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-2">
            Please create a user profile to chat with the AI coach
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatBox;