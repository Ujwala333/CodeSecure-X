# CodeSecureX

## Overview
CodeSecureX is an AI-powered code security platform that helps developers detect vulnerabilities in source code, generate actionable remediation guidance, and produce downloadable security reports.

The app combines a React/Next.js frontend with a FastAPI backend, MongoDB storage, and Nebius LLM integration for vulnerability scanning.

## Key Features
- **AI-driven vulnerability scanning** using Nebius LLM
- **JWT-protected user authentication** with registration, login, and password reset
- **Code scan history** persisted in MongoDB
- **PDF report generation** for security assessments
- **GitHub repository metadata analysis** for public repos
- **Modern dashboard and code editor UI** with Next.js and Monaco editor
- **Multi-language support** for Python, JavaScript, Java, and PHP

## Architecture
- `frontend/` — Next.js app, Tailwind-inspired UI, client-facing pages and components
- `backend/` — FastAPI service, Beanie ODM, Nebius/OpenAI integration, MongoDB persistence
- `backend/.env` — runtime configuration for Nebius, MongoDB, GitHub token, and email

## Requirements
- Python 3.11+ (backend)
- Node.js 18+ / npm (frontend)
- MongoDB instance or Atlas cluster
- Nebius API key for real LLM vulnerability scanning
- Optional GitHub token for higher GitHub API rate limits

## Setup
### 1. Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` with the following values:
```env
NEBIUS_API_KEY=your_nebius_api_key_here
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/securecodeai
GITHUB_TOKEN=ghp_xxx   # optional
```

Start the backend API:
```bash
cd backend
.\.venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open the UI at `http://localhost:3000`.

## Backend API Endpoints
- `POST /api/auth/register` — create a new user
- `POST /api/auth/login` — authenticate and receive JWT token
- `GET /api/auth/me` — get current authenticated user
- `POST /api/auth/forgot-password` — request password reset email
- `POST /api/auth/reset-password` — reset password using token
- `POST /api/scan/analyze` — submit code for vulnerability scanning
- `GET /api/scan/history` — retrieve recent scan history
- `POST /api/report/generate` — create a PDF security report for a scan
- `GET /api/report/{scan_id}` — download a generated PDF report
- `POST /api/github/analyze-repo` — inspect public GitHub repo file metadata
- `GET /api/history` — alias for `/api/scan/history`
- `GET /health` — health check endpoint

## Notes
- The backend uses `backend/services/llm_service.py` to call Nebius with model `meta-llama/Llama-3.3-70B-Instruct`.
- If `NEBIUS_API_KEY` is not provided, scan behavior may fall back to demo data.
- GitHub integration uses `GITHUB_TOKEN` if available; otherwise unauthenticated requests are limited to 60/hour.
- MongoDB persistence is handled by Beanie and will gracefully degrade if the database is unavailable.

## Project Structure
```text
CodeSecureX/
├── backend/
│   ├── main.py
│   ├── .env
│   ├── requirements.txt
│   ├── database/
│   ├── models/
│   ├── routes/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   └── utils/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── services/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Contributing
Contributions are welcome. Suggested workflow:
1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes with clear messages
4. Open a pull request

## License
Include your preferred license here if applicable.
