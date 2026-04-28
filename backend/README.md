# 🎓 Smart Study Coach - AI RAG System

An intelligent study coaching system powered by **Retrieval-Augmented Generation (RAG)** using **SQLite** + **NVIDIA API**.

## 🧠 System Overview

The AI Study Coach follows this workflow:
1. **Understand User Query** - Detect intent (study tracking, performance analysis, study plan generation, etc.)
2. **Retrieve Context (RAG)** - Query vector database for relevant study history
3. **AI Reasoning** - Use NVIDIA LLM to analyze context and generate personalized recommendations
4. **Structured Response** - Always includes Performance Summary, Weak Areas, Study Plan, and Next Steps

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite with vector embeddings
- **AI**: NVIDIA API (LLM + Embeddings)
- **RAG**: Vector similarity search with cosine similarity

## 📁 Project Structure

```
backend/
├── services/
│   ├── database.js          # SQLite database management
│   ├── nvidia-api.js        # NVIDIA API client
│   ├── rag-service.js       # RAG pipeline (embeddings + retrieval)
│   ├── study-service.js     # Study tracking & performance analysis
│   └── ai-coach.js          # Main AI Study Coach agent
├── routes/
│   └── study.js             # API routes
├── data/
│   └── study_coach.db       # SQLite database (auto-created)
├── server.js                # Main server
├── package.json
└── .env                     # Environment variables
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Update `.env` file:
```env
PORT=5000
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_API_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_LLM_MODEL=meta/llama-3.1-70b-instruct
NVIDIA_EMBEDDING_MODEL=nvidia/nv-embed-v1
DB_PATH=./data/study_coach.db
NODE_ENV=development
```

### 3. Get NVIDIA API Key
1. Go to [NVIDIA NGC](https://catalog.ngc.nvidia.com/)
2. Sign up/Login
3. Generate API key
4. Add to `.env` file

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Test the API
```bash
curl http://localhost:5000/health
```

## 📚 API Endpoints

### 🏥 Health Check
```bash
GET /health
```

### 👤 Create User
```bash
POST /api/study/user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "goals": "Improve in Math and Physics"
}
```

### 📝 Log Study Session
```bash
POST /api/study/log-session
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "subject": "Mathematics",
  "duration": 60,
  "score": 85,
  "notes": "Practiced calculus integration problems"
}
```

### 📊 Get Performance Summary
```bash
GET /api/study/performance/{userId}
```

### 🤖 Chat with AI Coach
```bash
POST /api/study/chat
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "query": "I'm struggling with physics. What should I focus on?",
  "intent": "study_plan_generation"
}
```

### 📅 Generate Study Plan
```bash
POST /api/study/generate-plan
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "preferences": {
    "duration": 120,
    "focusAreas": ["Mathematics", "Physics"]
  }
}
```

### 📈 Analyze Performance
```bash
GET /api/study/analyze/{userId}
```

## 🧩 AI Coach Response Format

The AI Coach always responds in this structured format:

```
📊 Performance Summary
Short analysis of student progress

⚠️ Weak Areas
- Subject 1: Specific issues
- Subject 2: Areas needing improvement

📅 Personalized Study Plan
- 6:00-7:00 PM → Subject focus
- 7:00-7:30 PM → Revision
- 8:00-9:00 PM → Practice problems

🎯 Next Action Steps
- Clear, actionable tasks
- Specific goals and deadlines
```

## 🗄️ Database Schema

### Tables Created Automatically:
- **users** - User profiles and goals
- **study_sessions** - Individual study sessions
- **performance_metrics** - Aggregated performance data
- **recommendations** - AI-generated recommendations
- **embeddings_store** - Vector embeddings for RAG

## 🔧 RAG System Details

### Embedding Generation
- Uses NVIDIA `nv-embed-v1` model
- Converts study sessions to 768-dimensional vectors
- Stores embeddings in SQLite as BLOB

### Vector Retrieval
- Cosine similarity search
- Returns top-K relevant study sessions
- Filters by user ID for privacy

### Context Augmentation
- Combines retrieved context with user query
- Includes performance metrics and weak areas
- Feeds enriched prompt to NVIDIA LLM

## 🎯 Usage Examples

### Example 1: New User Onboarding
```bash
# 1. Create user
curl -X POST http://localhost:5000/api/study/user \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# 2. First chat (will get onboarding response)
curl -X POST http://localhost:5000/api/study/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "query": "Help me get started"}'
```

### Example 2: Study Session Workflow
```bash
# 1. Log study session
curl -X POST http://localhost:5000/api/study/log-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "subject": "Physics",
    "duration": 45,
    "score": 65,
    "notes": "Struggled with kinematics problems"
  }'

# 2. Get AI analysis
curl -X POST http://localhost:5000/api/study/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "query": "Analyze my physics performance and suggest improvements"
  }'
```

### Example 3: Generate Study Plan
```bash
curl -X POST http://localhost:5000/api/study/generate-plan \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "preferences": {
      "duration": 90,
      "focusAreas": ["Physics", "Mathematics"]
    }
  }'
```

## 🔍 Troubleshooting

### NVIDIA API Issues
- Ensure API key is valid and has credits
- Check rate limits (may need to wait between requests)
- Verify model names in `.env` file

### Database Issues
- Database is created automatically in `./data/` folder
- Check file permissions if database creation fails
- SQLite file will grow as you add more study sessions

### Performance Issues
- Vector similarity search may be slow with many embeddings
- Consider implementing FAISS for production use
- Add database indexes for frequently queried fields

## 🚀 Next Steps

1. **Add Authentication** - Implement JWT tokens for user sessions
2. **Frontend Dashboard** - Build React.js interface
3. **Advanced RAG** - Implement FAISS for better vector search
4. **Spaced Repetition** - Add intelligent revision scheduling
5. **Mobile App** - Create React Native mobile interface

## 📄 License

MIT License - Feel free to use and modify!

---

**Ready to help students learn smarter! 🎓✨**