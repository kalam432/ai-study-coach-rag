const nvidiaAPI = require('./nvidia-api');
const ragService = require('./rag-service');
const studyService = require('./study-service');
const database = require('./database');
const { v4: uuidv4 } = require('uuid');

const SYSTEM_PROMPT = `You are an AI Study Coach Agent powered by a Retrieval-Augmented Generation (RAG) system.

Your job is to help students improve learning efficiency by:
- Tracking study habits
- Analyzing subject performance  
- Detecting weak topics
- Generating personalized study plans
- Suggesting revision schedules using spaced repetition
- Motivating consistent learning behavior

CORE BEHAVIOR:
You MUST always follow this workflow:

1. Understand User Query - Identify intent: study tracking, performance analysis, doubt solving, study plan generation, revision scheduling, weak topic identification

2. Retrieve Context (RAG STEP) - Query retrieved context includes: past study sessions, subject scores, weak areas, previous recommendations, notes uploaded by user

3. Reasoning (AI STEP) - Analyze retrieved context, find patterns in performance, detect weak subjects/topics, generate optimized learning strategy. DO NOT hallucinate missing study data.

4. Response Generation Rules - Your output must always include:
📊 Performance Summary: Short analysis of student progress
⚠️ Weak Areas: Subjects/topics needing improvement  
📅 Personalized Study Plan: daily schedule, time blocks (Pomodoro recommended), revision cycles
🎯 Next Action Steps: Clear tasks for the student

OUTPUT STYLE:
Be structured, concise, actionable, student-friendly, motivational but not emotional.
Avoid vague advice, generic study tips without context, hallucinated scores or data.

FINAL RULE:
Always act like a personal AI tutor + performance analyst + study planner combined into one system.`;

class AICoach {
  /**
   * Main entry point - analyze user query and generate response
   */
  async processQuery(userId, query, intent = null) {
    try {
      console.log(`🧠 Processing query for user ${userId}: ${query}`);

      // Step 1: Understand User Query
      const detectedIntent = intent || await this.detectIntent(query);
      console.log(`🎯 Detected intent: ${detectedIntent}`);

      // Step 2: Retrieve Context (RAG STEP)
      const context = await this.retrieveContext(userId, query);
      
      // Check if user has study data
      if (context.recentSessions.length === 0 && detectedIntent !== 'onboarding') {
        return this.generateOnboardingResponse();
      }

      // Step 3: Reasoning (AI STEP USING NVIDIA API)
      const response = await this.generateAIResponse(userId, query, context, detectedIntent);

      // Step 4: Store recommendation
      await this.storeRecommendation(userId, response, detectedIntent);

      return response;
    } catch (error) {
      console.error('❌ Error processing query:', error);
      throw error;
    }
  }

  /**
   * Detect user intent from query
   */
  async detectIntent(query) {
    const intents = {
      'study_tracking': ['log', 'record', 'track', 'session', 'studied'],
      'performance_analysis': ['performance', 'progress', 'analysis', 'how am i doing', 'summary'],
      'doubt_solving': ['doubt', 'question', 'help', 'explain', 'understand'],
      'study_plan_generation': ['plan', 'schedule', 'what to study', 'recommend', 'suggest'],
      'revision_scheduling': ['revision', 'review', 'spaced repetition', 'when to revise'],
      'weak_topic_identification': ['weak', 'struggling', 'difficult', 'improve', 'problem']
    };

    const queryLower = query.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return intent;
      }
    }
    
    return 'study_plan_generation'; // Default intent
  }

  /**
   * Retrieve context using RAG system
   */
  async retrieveContext(userId, query) {
    try {
      // Get study context from RAG service
      const ragContext = await ragService.getStudyContext(userId, query);
      
      // Get performance summary
      const performanceSummary = await studyService.getPerformanceSummary(userId);
      
      // Get recent recommendations
      const recentRecommendations = await database.getAllRows(
        'SELECT recommendation_text, recommendation_type, created_at FROM recommendations WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId]
      );

      return {
        ...ragContext,
        performanceSummary: performanceSummary,
        recentRecommendations: recentRecommendations
      };
    } catch (error) {
      console.error('❌ Error retrieving context:', error);
      throw error;
    }
  }

  /**
   * Generate AI response using NVIDIA API
   */
  async generateAIResponse(userId, query, context, intent) {
    try {
      // Check if NVIDIA API is available
      if (!nvidiaAPI.isConfigured()) {
        console.warn('⚠️ NVIDIA API not configured, using fallback response');
        return this.generateFallbackResponse(context, intent);
      }

      // Construct prompt with retrieved context
      const prompt = this.constructPrompt(query, context, intent);
      
      // Try to generate response using NVIDIA API
      try {
        const aiResponse = await nvidiaAPI.generateCompletion(prompt, SYSTEM_PROMPT, {
          temperature: 0.7,
          maxTokens: 1000
        });
        return aiResponse;
      } catch (apiError) {
        console.warn('⚠️ NVIDIA API call failed, using fallback response:', apiError.message);
        return this.generateFallbackResponse(context, intent);
      }
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      // Fallback response if AI fails
      return this.generateFallbackResponse(context, intent);
    }
  }

  /**
   * Construct prompt with context for NVIDIA API
   */
  constructPrompt(query, context, intent) {
    let prompt = `User Query: "${query}"\nIntent: ${intent}\n\n`;

    // Add performance summary
    if (context.performanceSummary) {
      const perf = context.performanceSummary;
      prompt += `PERFORMANCE DATA:\n`;
      prompt += `- Total Sessions: ${perf.totalSessions}\n`;
      prompt += `- Total Study Time: ${perf.totalTime} minutes\n`;
      
      if (perf.weakSubjects.length > 0) {
        prompt += `- Weak Subjects: ${perf.weakSubjects.map(s => `${s.subject} (${s.average_score}%)`).join(', ')}\n`;
      }
      
      if (perf.strongSubjects.length > 0) {
        prompt += `- Strong Subjects: ${perf.strongSubjects.map(s => `${s.subject} (${s.average_score}%)`).join(', ')}\n`;
      }
      prompt += '\n';
    }

    // Add recent study sessions
    if (context.recentSessions && context.recentSessions.length > 0) {
      prompt += `RECENT STUDY SESSIONS:\n`;
      context.recentSessions.slice(0, 10).forEach((session, idx) => {
        prompt += `${idx + 1}. ${session.subject} - ${session.duration}min`;
        if (session.score !== null) prompt += ` (Score: ${session.score}%)`;
        if (session.notes) prompt += ` - Notes: ${session.notes}`;
        prompt += `\n`;
      });
      prompt += '\n';
    }

    // Add relevant RAG content
    if (context.relevantContent && context.relevantContent.length > 0) {
      prompt += `RELEVANT PAST CONTEXT:\n`;
      context.relevantContent.forEach((item, idx) => {
        prompt += `${idx + 1}. ${item.content} (Relevance: ${(item.similarity * 100).toFixed(1)}%)\n`;
      });
      prompt += '\n';
    }

    // Add recent recommendations
    if (context.recentRecommendations && context.recentRecommendations.length > 0) {
      prompt += `PREVIOUS RECOMMENDATIONS:\n`;
      context.recentRecommendations.slice(0, 3).forEach((rec, idx) => {
        prompt += `${idx + 1}. ${rec.recommendation_text}\n`;
      });
      prompt += '\n';
    }

    prompt += `Please provide a structured response following the required format with Performance Summary, Weak Areas, Personalized Study Plan, and Next Action Steps.`;

    return prompt;
  }

  /**
   * Generate fallback response when AI fails
   */
  generateFallbackResponse(context, intent) {
    const perf = context.performanceSummary;
    
    let response = `📊 **Performance Summary**\n`;
    if (perf && perf.totalSessions > 0) {
      response += `You have completed ${perf.totalSessions} study sessions with ${Math.round(perf.totalTime)} minutes of total study time.\n`;
      
      if (perf.averageScore) {
        response += `Your average performance score is ${Math.round(perf.averageScore)}%.\n`;
      }
    } else {
      response += `No study data available yet. Start logging your study sessions!\n`;
    }
    response += `\n`;

    response += `⚠️ **Weak Areas**\n`;
    if (perf && perf.weakSubjects.length > 0) {
      perf.weakSubjects.forEach(subject => {
        response += `- **${subject.subject}**: Average score ${Math.round(subject.average_score)}% (${subject.session_count} sessions)\n`;
      });
    } else {
      response += `- No weak areas identified yet. Keep studying and logging sessions!\n`;
    }
    response += `\n`;

    response += `💪 **Strong Areas**\n`;
    if (perf && perf.strongSubjects.length > 0) {
      perf.strongSubjects.forEach(subject => {
        response += `- **${subject.subject}**: Average score ${Math.round(subject.average_score)}% (${subject.session_count} sessions)\n`;
      });
    } else {
      response += `- Keep building your strengths by consistent practice!\n`;
    }
    response += `\n`;

    response += `📅 **Personalized Study Plan**\n`;
    
    // Generate plan based on intent and data
    if (intent === 'study_plan_generation' || intent === 'revision_scheduling') {
      if (perf && perf.weakSubjects.length > 0) {
        response += `**Today's Focus (2-3 hours):**\n`;
        perf.weakSubjects.slice(0, 2).forEach((subject, index) => {
          const timeSlot = index === 0 ? '6:00-7:30 PM' : '8:00-9:00 PM';
          response += `- ${timeSlot}: ${subject.subject} practice (focus on fundamentals)\n`;
        });
        
        response += `\n**This Week's Schedule:**\n`;
        response += `- **Monday/Wednesday/Friday**: Focus on ${perf.weakSubjects[0].subject}\n`;
        response += `- **Tuesday/Thursday**: Practice ${perf.weakSubjects.length > 1 ? perf.weakSubjects[1].subject : 'mixed subjects'}\n`;
        response += `- **Weekend**: Review and test yourself on all subjects\n`;
      } else {
        response += `**Daily Schedule (Pomodoro Method):**\n`;
        response += `- 6:00-6:25 PM: Subject 1 (25 min focus)\n`;
        response += `- 6:25-6:30 PM: Break (5 min)\n`;
        response += `- 6:30-6:55 PM: Subject 2 (25 min focus)\n`;
        response += `- 6:55-7:00 PM: Break (5 min)\n`;
        response += `- 7:00-7:25 PM: Review/Practice problems\n`;
      }
    } else {
      response += `- Use 25-minute Pomodoro blocks with 5-minute breaks\n`;
      response += `- Focus on consistent daily study sessions\n`;
      response += `- Review weak topics every 2-3 days using spaced repetition\n`;
    }
    response += `\n`;

    response += `🧠 **Study Strategy**\n`;
    if (perf && perf.weakSubjects.length > 0) {
      response += `**Technique**: Active Recall + Spaced Repetition\n`;
      response += `**Why**: Your weak areas need more frequent review. Test yourself instead of just re-reading.\n`;
      response += `**Method**: \n`;
      response += `1. Study topic for 20 minutes\n`;
      response += `2. Close books and write what you remember\n`;
      response += `3. Check accuracy and note gaps\n`;
      response += `4. Review gaps after 1 day, then 3 days, then 1 week\n`;
    } else {
      response += `**Technique**: Interleaving + Practice Testing\n`;
      response += `**Why**: Mix different topics in one session to improve retention.\n`;
      response += `**Method**: Study Topic A for 15 min → Topic B for 15 min → Test both\n`;
    }
    response += `\n`;

    response += `🎯 **Next Action Steps**\n`;
    if (perf && perf.totalSessions === 0) {
      response += `1. **Log your first study session** with subject, duration, and difficulty score\n`;
      response += `2. **Study for at least 30 minutes** today using the Pomodoro technique\n`;
      response += `3. **Track 3-5 sessions** this week to get personalized insights\n`;
    } else if (perf && perf.weakSubjects.length > 0) {
      response += `1. **Focus on ${perf.weakSubjects[0].subject}** - spend 60% of study time here\n`;
      response += `2. **Practice active recall** - test yourself without looking at notes\n`;
      response += `3. **Log today's session** and aim for a score above ${Math.round(perf.weakSubjects[0].average_score) + 10}%\n`;
    } else {
      response += `1. **Maintain consistency** - study at least 4 days this week\n`;
      response += `2. **Challenge yourself** - try harder problems or new topics\n`;
      response += `3. **Track your progress** - log sessions with scores and notes\n`;
    }

    // Add motivational note
    response += `\n💡 **Remember**: Consistent small efforts beat sporadic intense sessions. You've got this! 🚀`;

    return response;
  }

  /**
   * Generate onboarding response for new users
   */
  generateOnboardingResponse() {
    return `🎓 **Welcome to Your AI Study Coach!**

📊 **Getting Started**
I don't see any study data yet. Let's start tracking your learning journey!

⚠️ **What I Need**
- Log your study sessions with subject, duration, and scores
- Add notes about what you found difficult
- Be consistent - even 30 minutes counts!

📅 **Recommended First Steps**
1. **Today (30-60 minutes):**
   - Choose your most important subject
   - Study for 25 minutes (Pomodoro technique)
   - Take a 5-minute break
   - Log the session with a difficulty score (1-10)

2. **This Week:**
   - Study at least 4 days
   - Track 2-3 different subjects
   - Note which topics feel challenging

🎯 **Next Actions**
- Use the /log-session endpoint to record your first study session
- Include: subject, duration (minutes), score (if you took a test), and notes
- After 3-5 sessions, ask me for a personalized study plan!

Start logging your sessions, and I'll provide data-driven insights to boost your learning efficiency! 🚀`;
  }

  /**
   * Store recommendation in database
   */
  async storeRecommendation(userId, recommendation, type) {
    try {
      await database.runQuery(
        'INSERT INTO recommendations (id, user_id, recommendation_text, recommendation_type) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, recommendation, type]
      );
      console.log(`✅ Stored recommendation for user ${userId}`);
    } catch (error) {
      console.error('❌ Error storing recommendation:', error);
      // Don't throw error - this is background operation
    }
  }

  /**
   * Generate study plan based on performance data
   */
  async generateStudyPlan(userId, preferences = {}) {
    try {
      const query = `Generate a personalized study plan for today and this week based on my performance data. 
                     Preferences: ${JSON.stringify(preferences)}`;
      
      return await this.processQuery(userId, query, 'study_plan_generation');
    } catch (error) {
      console.error('❌ Error generating study plan:', error);
      throw error;
    }
  }

  /**
   * Analyze performance and provide insights
   */
  async analyzePerformance(userId) {
    try {
      const query = 'Analyze my study performance and identify areas for improvement';
      return await this.processQuery(userId, query, 'performance_analysis');
    } catch (error) {
      console.error('❌ Error analyzing performance:', error);
      throw error;
    }
  }
}

module.exports = new AICoach();