# LogPulse Engine ⚡️ Production AI Edition

[![Status](https://img.shields.io/badge/Status-Production_Ready-emerald?style=for-the-badge)](https://github.com/Sandipan003/LogPulse)
[![AI](https://img.shields.io/badge/AI-Gemini_1.5_Flash-blue?style=for-the-badge)](https://deepmind.google/technologies/gemini/)
[![Database](https://img.shields.io/badge/Database-MySQL-orange?style=for-the-badge)](https://www.mysql.com/)

**LogPulse** is a production-grade log diagnostic tool that transforms noisy application logs into actionable engineering intelligence. Powered by **Google Gemini 1.5 Flash**, it identifies root causes, technical impacts, and remediation steps in seconds.

---

## 🌟 Key Features

- **🚀 Generative AI Diagnostics**: Integrated with Google Gemini to provide deep technical failure analysis and impact assessments.
- **📊 Multi-Series Analytics**: Real-time density timeline visualizing Total Logs, Errors, Warnings, and Unstructured data.
- **🗄️ MySQL Persistence**: Every analysis is permanently registered in MySQL for historic auditing and trend analysis.
- **🔍 Deep-Dive Evidence**: Smart clustering with expandable raw log samples for every detected signature.
- **🛠️ Auto-Fix Generator**: Automatically generates bash remediation scripts based on AI-detected failure patterns.
- **⚡ High-Performance Parser**: Robust support for JSON, Nginx/Apache, Spring Boot, and Generic log formats with multi-line stack trace support.

---

## 🔬 Technology Stack

- **Frontend**: React 18, Vite, Chart.js, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, Sequelize ORM.
- **AI**: Google Generative AI (Gemini 1.5 Flash).
- **Database**: MySQL 8.0+ (Persistent storage).

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here

# MySQL Configuration
MYSQL_DB=logpulse_db
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_HOST=127.0.0.1
```

---

## 🏗️ Getting Started

### 1. Database Setup
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE logpulse_db;
```

### 2. Backend Installation
```bash
cd backend
npm install
node server.js
```

### 3. Frontend Installation
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Engine
Open `http://localhost:5173` in your browser.

---

## 📖 Deployment Notes
- **Security**: The `.gitignore` is configured to protect your `.env` secrets. Never commit your API keys.
- **Scaling**: The system uses streaming readers to process up to 10,000 lines per request without memory exhaustion.

---

## 👨‍💻 Author
**Sandipan** - [GitHub](https://github.com/Sandipan003)
