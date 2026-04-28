const express = require('express');
const studyService = require('../services/study-service');
const aiCoach = require('../services/ai-coach');
const router = express.Router();

/**
 * Create or get user
 * POST /api/study/user
 */
router.post('/user', async (req, res) => {
  try {
    const { name, email, goals } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and email are required'
      });
    }

    const userId = await studyService.createUser({ name, email, goals });
    
    res.status(201).json({
      status: 'success',
      data: { userId, name, email, goals }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
});

/**
 * Log study session
 * POST /api/study/log-session
 */
router.post('/log-session', async (req, res) => {
  try {
    const { userId, subject, duration, score, notes } = req.body;
    
    if (!userId || !subject || !duration) {
      return res.status(400).json({
        status: 'error',
        message: 'userId, subject, and duration are required'
      });
    }

    const sessionId = await studyService.logStudySession(userId, {
      subject,
      duration,
      score,
      notes
    });
    
    res.status(201).json({
      status: 'success',
      data: { 
        sessionId,
        message: 'Study session logged successfully'
      }
    });
  } catch (error) {
    console.error('Error logging study session:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to log study session'
    });
  }
});

/**
 * Get study sessions
 * GET /api/study/sessions/:userId
 */
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, startDate, endDate, limit } = req.query;
    
    const filters = {};
    if (subject) filters.subject = subject;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (limit) filters.limit = parseInt(limit);

    const sessions = await studyService.getStudySessions(userId, filters);
    
    res.json({
      status: 'success',
      data: sessions
    });
  } catch (error) {
    console.error('Error getting study sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get study sessions'
    });
  }
});

/**
 * Get performance summary
 * GET /api/study/performance/:userId
 */
router.get('/performance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const performance = await studyService.getPerformanceSummary(userId);
    
    res.json({
      status: 'success',
      data: performance
    });
  } catch (error) {
    console.error('Error getting performance summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance summary'
    });
  }
});

/**
 * Generate study plan using AI Coach
 * POST /api/study/generate-plan
 */
router.post('/generate-plan', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'userId is required'
      });
    }

    const studyPlan = await aiCoach.generateStudyPlan(userId, preferences);
    
    res.json({
      status: 'success',
      data: { studyPlan }
    });
  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate study plan'
    });
  }
});

/**
 * Chat with AI Coach
 * POST /api/study/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { userId, query, intent } = req.body;
    
    if (!userId || !query) {
      return res.status(400).json({
        status: 'error',
        message: 'userId and query are required'
      });
    }

    const response = await aiCoach.processQuery(userId, query, intent);
    
    res.json({
      status: 'success',
      data: { response }
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process query'
    });
  }
});

/**
 * Analyze performance using AI Coach
 * GET /api/study/analyze/:userId
 */
router.get('/analyze/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const analysis = await aiCoach.analyzePerformance(userId);
    
    res.json({
      status: 'success',
      data: { analysis }
    });
  } catch (error) {
    console.error('Error analyzing performance:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze performance'
    });
  }
});

module.exports = router;