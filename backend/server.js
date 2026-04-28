// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import services
const database = require('./services/database');
const nvidiaAPI = require('./services/nvidia-api');

// Import routes
const studyRoutes = require('./routes/study');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Get PORT from environment variables or use default 5000
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies
app.use(cors()); // Enable CORS for all routes

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/study', studyRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    nvidia_configured: nvidiaAPI.isConfigured(),
    database: 'SQLite'
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    name: 'Smart Study Coach API',
    version: '1.0.0',
    description: 'AI Study Coach with RAG system using SQLite + NVIDIA API',
    endpoints: {
      'POST /api/study/user': 'Create or get user',
      'POST /api/study/log-session': 'Log a study session',
      'GET /api/study/sessions/:userId': 'Get study sessions',
      'GET /api/study/performance/:userId': 'Get performance summary',
      'POST /api/study/generate-plan': 'Generate AI study plan',
      'POST /api/study/chat': 'Chat with AI Coach',
      'GET /api/study/analyze/:userId': 'Analyze performance with AI'
    },
    tech_stack: {
      backend: 'Node.js + Express',
      database: 'SQLite',
      ai: 'NVIDIA API',
      rag: 'Vector embeddings in SQLite'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await database.initialize();
    
    // Check NVIDIA API configuration
    if (!nvidiaAPI.isConfigured()) {
      console.warn('⚠️ NVIDIA API key not configured. AI features will not work.');
      console.warn('   Please set NVIDIA_API_KEY in your .env file');
    } else {
      console.log('✅ NVIDIA API configured');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Smart Study Coach API Server Started!`);
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`📚 API Info: http://localhost:${PORT}/api`);
      console.log(`\n📋 Available Endpoints:`);
      console.log(`   POST /api/study/user - Create user`);
      console.log(`   POST /api/study/log-session - Log study session`);
      console.log(`   GET  /api/study/sessions/:userId - Get sessions`);
      console.log(`   GET  /api/study/performance/:userId - Get performance`);
      console.log(`   POST /api/study/generate-plan - Generate AI study plan`);
      console.log(`   POST /api/study/chat - Chat with AI Coach`);
      console.log(`   GET  /api/study/analyze/:userId - AI performance analysis`);
      console.log(`\n💡 Ready to help students learn smarter! 🎓`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down server...');
  try {
    await database.close();
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();