const nvidiaAPI = require('./nvidia-api');
const database = require('./database');
const { v4: uuidv4 } = require('uuid');

class RAGService {
  constructor() {
    this.embeddingDimension = 768; // NVIDIA embedding dimension
  }

  /**
   * Store content with embedding in vector database
   */
  async storeContent(userId, content, metadata = {}) {
    try {
      // Generate embedding for content
      const embedding = await nvidiaAPI.generateEmbedding(content);
      
      // Convert embedding array to buffer for SQLite storage
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
      
      // Store in embeddings_store table
      const id = uuidv4();
      await database.runQuery(
        `INSERT INTO embeddings_store (id, user_id, content, embedding, metadata, created_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, userId, content, embeddingBuffer, JSON.stringify(metadata)]
      );

      console.log(`✅ Stored content with embedding for user ${userId}`);
      return id;
    } catch (error) {
      console.error('❌ Error storing content:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant content using vector similarity search
   */
  async retrieveRelevantContent(userId, query, topK = 5) {
    try {
      // Try to generate embedding for query
      let queryEmbedding;
      try {
        queryEmbedding = await nvidiaAPI.generateEmbedding(query);
      } catch (error) {
        console.warn('⚠️ NVIDIA API unavailable, falling back to keyword search');
        return await this.keywordBasedRetrieval(userId, query, topK);
      }
      
      // Get all embeddings for user
      const storedEmbeddings = await database.getAllRows(
        'SELECT id, content, embedding, metadata FROM embeddings_store WHERE user_id = ?',
        [userId]
      );

      if (storedEmbeddings.length === 0) {
        console.log(`ℹ️ No stored content found for user ${userId}`);
        return [];
      }

      // Calculate cosine similarity for each stored embedding
      const similarities = storedEmbeddings.map(item => {
        const storedEmbedding = new Float32Array(item.embedding.buffer);
        const similarity = this.cosineSimilarity(queryEmbedding, Array.from(storedEmbedding));
        
        return {
          id: item.id,
          content: item.content,
          metadata: JSON.parse(item.metadata || '{}'),
          similarity: similarity
        };
      });

      // Sort by similarity (highest first) and return top K
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topResults = similarities.slice(0, topK).filter(item => item.similarity > 0.3);

      console.log(`✅ Retrieved ${topResults.length} relevant items for user ${userId}`);
      return topResults;
    } catch (error) {
      console.error('❌ Error retrieving content:', error);
      // Fallback to keyword search
      return await this.keywordBasedRetrieval(userId, query, topK);
    }
  }

  /**
   * Store study session in RAG system
   */
  async storeStudySession(userId, sessionData) {
    try {
      const { subject, duration, score, notes, timestamp } = sessionData;
      
      // Format session as text for embedding
      const sessionText = this.formatSessionForEmbedding(sessionData);
      
      // Store with metadata
      const metadata = {
        type: 'study_session',
        subject: subject,
        duration: duration,
        score: score,
        timestamp: timestamp
      };

      try {
        await this.storeContent(userId, sessionText, metadata);
        console.log(`✅ Stored study session in RAG: ${subject}`);
      } catch (error) {
        console.warn('⚠️ Could not store in vector database, storing in fallback format');
        // Store in a simple text format for keyword search
        await this.storeContentFallback(userId, sessionText, metadata);
      }
    } catch (error) {
      console.error('❌ Error storing study session in RAG:', error);
      // Don't throw error - this is async operation
    }
  }

  /**
   * Retrieve study context for AI analysis
   */
  async getStudyContext(userId, query) {
    try {
      // Get relevant study sessions
      const relevantContent = await this.retrieveRelevantContent(userId, query, 10);
      
      // Get recent performance data
      const recentSessions = await database.getAllRows(
        `SELECT subject, duration, score, notes, timestamp 
         FROM study_sessions 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 20`,
        [userId]
      );

      // Get performance metrics
      const performanceMetrics = await database.getAllRows(
        'SELECT subject, average_score, total_time, session_count, weak_areas FROM performance_metrics WHERE user_id = ?',
        [userId]
      );

      return {
        relevantContent: relevantContent,
        recentSessions: recentSessions,
        performanceMetrics: performanceMetrics
      };
    } catch (error) {
      console.error('❌ Error getting study context:', error);
      throw error;
    }
  }

  /**
   * Format study session for embedding
   */
  formatSessionForEmbedding(sessionData) {
    const { subject, duration, score, notes } = sessionData;
    let text = `Subject: ${subject}, Duration: ${duration} minutes`;
    
    if (score !== null && score !== undefined) {
      text += `, Score: ${score}%`;
    }
    
    if (notes && notes.trim()) {
      text += `, Notes: ${notes}`;
    }
    
    return text;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Fallback keyword-based retrieval when embeddings are not available
   */
  async keywordBasedRetrieval(userId, query, topK = 5) {
    try {
      // Get recent study sessions for keyword matching
      const recentSessions = await database.getAllRows(
        `SELECT subject, duration, score, notes, timestamp 
         FROM study_sessions 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 50`,
        [userId]
      );

      if (recentSessions.length === 0) {
        return [];
      }

      // Extract keywords from query
      const queryKeywords = query.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'use', 'her', 'how', 'its', 'our', 'out', 'two', 'way', 'who', 'oil', 'sit', 'set'].includes(word));

      // Score sessions based on keyword matches
      const scoredSessions = recentSessions.map(session => {
        const sessionText = this.formatSessionForEmbedding(session).toLowerCase();
        let score = 0;

        queryKeywords.forEach(keyword => {
          if (sessionText.includes(keyword)) {
            score += 1;
          }
          // Boost score for subject matches
          if (session.subject.toLowerCase().includes(keyword)) {
            score += 2;
          }
        });

        return {
          id: `session_${session.timestamp}`,
          content: this.formatSessionForEmbedding(session),
          metadata: {
            type: 'study_session',
            subject: session.subject,
            duration: session.duration,
            score: session.score,
            timestamp: session.timestamp
          },
          similarity: score / Math.max(queryKeywords.length, 1) // Normalize score
        };
      });

      // Sort by score and return top results
      scoredSessions.sort((a, b) => b.similarity - a.similarity);
      const topResults = scoredSessions.slice(0, topK).filter(item => item.similarity > 0);

      console.log(`✅ Retrieved ${topResults.length} items using keyword search for user ${userId}`);
      return topResults;
    } catch (error) {
      console.error('❌ Error in keyword-based retrieval:', error);
      return [];
    }
  }

  /**
   * Store content without embeddings (fallback)
   */
  async storeContentFallback(userId, content, metadata = {}) {
    try {
      // Store in a simple table for keyword search
      const id = uuidv4();
      await database.runQuery(
        `INSERT OR IGNORE INTO study_context (id, user_id, content, metadata, created_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, userId, content, JSON.stringify(metadata)]
      );

      console.log(`✅ Stored content in fallback format for user ${userId}`);
      return id;
    } catch (error) {
      console.error('❌ Error storing content in fallback format:', error);
      // Create table if it doesn't exist
      try {
        await database.runQuery(`
          CREATE TABLE IF NOT EXISTS study_context (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        // Retry storing
        await database.runQuery(
          `INSERT INTO study_context (id, user_id, content, metadata, created_at) 
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [id, userId, content, JSON.stringify(metadata)]
        );
        console.log(`✅ Created table and stored content for user ${userId}`);
      } catch (retryError) {
        console.error('❌ Failed to create fallback table:', retryError);
      }
    }
  }
}

module.exports = new RAGService();