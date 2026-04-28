const database = require('./database');
const ragService = require('./rag-service');
const { v4: uuidv4 } = require('uuid');

class StudyService {
  /**
   * Create or get user
   */
  async createUser(userData) {
    const { name, email, goals } = userData;
    
    try {
      const userId = uuidv4();
      
      await database.runQuery(
        'INSERT INTO users (id, name, email, goals) VALUES (?, ?, ?, ?)',
        [userId, name, email, goals || '']
      );
      
      console.log(`✅ Created user: ${name}`);
      return userId;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        // User already exists, get existing user
        const user = await database.getRow('SELECT id FROM users WHERE email = ?', [email]);
        return user.id;
      }
      throw error;
    }
  }

  /**
   * Log a study session
   */
  async logStudySession(userId, sessionData) {
    try {
      const { subject, duration, score, notes } = sessionData;
      const sessionId = uuidv4();
      
      // Validate input
      if (!subject || !duration) {
        throw new Error('Subject and duration are required');
      }
      
      if (duration < 1 || duration > 1440) {
        throw new Error('Duration must be between 1 and 1440 minutes');
      }
      
      if (score !== null && score !== undefined && (score < 0 || score > 100)) {
        throw new Error('Score must be between 0 and 100');
      }

      // Store in database
      await database.runQuery(
        `INSERT INTO study_sessions (id, user_id, subject, duration, score, notes, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [sessionId, userId, subject, duration, score, notes || '']
      );

      // Store in RAG system (async)
      ragService.storeStudySession(userId, {
        ...sessionData,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('RAG storage error:', err));

      // Update performance metrics
      await this.updatePerformanceMetrics(userId, subject);

      console.log(`✅ Logged study session: ${subject} (${duration}min)`);
      return sessionId;
    } catch (error) {
      console.error('❌ Error logging study session:', error);
      throw error;
    }
  }

  /**
   * Get study sessions for user
   */
  async getStudySessions(userId, filters = {}) {
    try {
      let query = 'SELECT * FROM study_sessions WHERE user_id = ?';
      const params = [userId];
      
      // Add filters
      if (filters.subject) {
        query += ' AND subject LIKE ?';
        params.push(`%${filters.subject}%`);
      }
      
      if (filters.startDate) {
        query += ' AND timestamp >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        query += ' AND timestamp <= ?';
        params.push(filters.endDate);
      }
      
      query += ' ORDER BY timestamp DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const sessions = await database.getAllRows(query, params);
      return sessions;
    } catch (error) {
      console.error('❌ Error getting study sessions:', error);
      throw error;
    }
  }

  /**
   * Update performance metrics for a subject
   */
  async updatePerformanceMetrics(userId, subject) {
    try {
      // Get all sessions for this subject
      const sessions = await database.getAllRows(
        'SELECT score, duration FROM study_sessions WHERE user_id = ? AND subject = ?',
        [userId, subject]
      );

      if (sessions.length === 0) return;

      // Calculate metrics
      const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
      const sessionCount = sessions.length;
      
      // Calculate average score (only for sessions with scores)
      const sessionsWithScores = sessions.filter(s => s.score !== null);
      const averageScore = sessionsWithScores.length > 0 
        ? sessionsWithScores.reduce((sum, s) => sum + s.score, 0) / sessionsWithScores.length
        : null;

      // Identify weak areas (scores < 70)
      const weakAreas = sessionsWithScores
        .filter(s => s.score < 70)
        .map(s => `Score: ${s.score}%`)
        .slice(0, 5); // Keep last 5 weak performances

      // Update or insert performance metrics
      const existingMetric = await database.getRow(
        'SELECT id FROM performance_metrics WHERE user_id = ? AND subject = ?',
        [userId, subject]
      );

      if (existingMetric) {
        await database.runQuery(
          `UPDATE performance_metrics 
           SET average_score = ?, total_time = ?, session_count = ?, weak_areas = ?, last_updated = CURRENT_TIMESTAMP
           WHERE user_id = ? AND subject = ?`,
          [averageScore, totalTime, sessionCount, JSON.stringify(weakAreas), userId, subject]
        );
      } else {
        await database.runQuery(
          `INSERT INTO performance_metrics (id, user_id, subject, average_score, total_time, session_count, weak_areas)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), userId, subject, averageScore, totalTime, sessionCount, JSON.stringify(weakAreas)]
        );
      }

      console.log(`✅ Updated performance metrics for ${subject}`);
    } catch (error) {
      console.error('❌ Error updating performance metrics:', error);
      // Don't throw error - this is background operation
    }
  }

  /**
   * Get performance summary for user
   */
  async getPerformanceSummary(userId) {
    try {
      // Get overall metrics
      const totalSessions = await database.getRow(
        'SELECT COUNT(*) as count, SUM(duration) as total_time FROM study_sessions WHERE user_id = ?',
        [userId]
      );

      // Get subject-wise performance
      const subjectMetrics = await database.getAllRows(
        'SELECT subject, average_score, total_time, session_count, weak_areas FROM performance_metrics WHERE user_id = ?',
        [userId]
      );

      // Get recent activity (last 7 days)
      const recentActivity = await database.getAllRows(
        `SELECT subject, COUNT(*) as sessions, SUM(duration) as time 
         FROM study_sessions 
         WHERE user_id = ? AND timestamp >= datetime('now', '-7 days')
         GROUP BY subject`,
        [userId]
      );

      // Identify weak subjects (average score < 70)
      const weakSubjects = subjectMetrics
        .filter(m => m.average_score !== null && m.average_score < 70)
        .sort((a, b) => a.average_score - b.average_score);

      // Identify strong subjects (average score >= 85)
      const strongSubjects = subjectMetrics
        .filter(m => m.average_score !== null && m.average_score >= 85)
        .sort((a, b) => b.average_score - a.average_score);

      return {
        totalSessions: totalSessions.count || 0,
        totalTime: totalSessions.total_time || 0,
        subjectMetrics: subjectMetrics,
        recentActivity: recentActivity,
        weakSubjects: weakSubjects,
        strongSubjects: strongSubjects
      };
    } catch (error) {
      console.error('❌ Error getting performance summary:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    try {
      const user = await database.getRow('SELECT * FROM users WHERE id = ?', [userId]);
      return user;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  }
}

module.exports = new StudyService();