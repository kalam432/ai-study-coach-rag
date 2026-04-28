# 🧠 AI Study Coach (RAG-based Learning Assistant)

An intelligent AI-powered Study Coach system that uses **Retrieval-Augmented Generation (RAG)** to track student study habits, analyze performance, detect weak topics, and generate personalized study plans using **NVIDIA LLM + Node.js + SQLite**.

---

## 🚀 Features

- 📊 Track student study sessions (subject, score, time spent)
- 🧠 AI-powered performance analysis using RAG
- ⚠️ Weak topic detection
- 📅 Personalized daily study plans
- 🤖 AI Chat Assistant (NVIDIA LLM powered)
- 📚 Vector-based memory using embeddings
- 🗄️ Lightweight SQLite database (no external DB required)

---

## 🏗️ Tech Stack

### Backend:
- Node.js
- Express.js
- SQLite
- NVIDIA API (LLM + Embeddings)

### AI Layer:
- RAG (Retrieval-Augmented Generation)
- Vector similarity search (cosine similarity)
- Context-aware prompting

### Frontend (if included):
- React.js
- Tailwind CSS
- Recharts

---

## 📂 Project Structure
backend/
├── server.js
├── database.js
├── rag-service.js
├── study-service.js
├── ai-coach.js
├── nvidia-api.js
├── routes/

frontend/
├── src/
├── components/
├── pages/


---

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-study-coach-rag.git
cd ai-study-coach-rag
2. Install backend dependencies
cd backend
npm install
3. Setup environment variables

Create .env file:

NVIDIA_API_KEY=your_nvidia_api_key_here
PORT=3001
4. Run backend server
npm run dev
📡 API Endpoints
👤 User
POST /api/study/user → Create user
📚 Study Tracking
POST /api/study/log-session → Log study session
GET /api/study/sessions/:userId → Get sessions
📊 Performance
GET /api/study/performance/:userId → Get performance analysis
🤖 AI Features
POST /api/study/chat → Chat with AI Study Coach
POST /api/study/generate-plan → Generate study plan
GET /api/study/analyze/:userId → AI performance analysis
🧠 How It Works (RAG Pipeline)
User Input
   ↓
Fetch study history (SQLite)
   ↓
Retrieve relevant context (Vector search)
   ↓
Send context + query to NVIDIA LLM
   ↓
AI generates personalized response
   ↓
Return structured study plan
📊 Example AI Output
📊 Performance Summary:
You are strong in Math but weak in Physics problem solving.

⚠️ Weak Areas:
- Physics: Kinematics
- Chemistry: Organic Reactions

📅 Study Plan:
- 6:00–7:00 PM → Physics practice
- 7:00–7:30 PM → Revision
- 8:00–9:00 PM → Chemistry notes

🎯 Next Steps:
- Solve 20 physics problems daily
- Revise weak topics every 2 days
🔥 Future Improvements
🌐 Deploy frontend + backend
📱 Mobile app version
📈 Advanced analytics dashboard
🧠 Better embedding model tuning
🔔 Smart reminders & notifications
👨‍💻 Author

Built as a full-stack AI RAG project for intelligent personalized learning.

⭐ If you like this project

Give a star ⭐ and feel free to fork!


---

# 🚀 HOW TO ADD IT TO GITHUB

## Option 1 (Easy)

1. Go to your GitHub repo
2. Click **Add file → Create new file**
3. Name it:


README.md


4. Paste above content
5. Click **Commit**

---

## Option 2 (Local Git)

```bash
git add README.md
git commit -m "add professional README"
git push
