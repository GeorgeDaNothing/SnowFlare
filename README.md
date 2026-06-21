# SnowFlare

A modern React application for snowboard performance analysis, featuring video analysis, move design, jump simulation, AI-powered insights, and a complete user authentication system.

## Features

- **Dashboard** — Overview of your performance metrics and recent activity
- **Video Analysis** — Upload and analyze training videos
- **Move Designer** — Design and refine athletic movements
- **AI Insights** — AI-powered analysis and recommendations
- **Authentication System** — Full user registration, login, and password recovery

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Framer Motion (via `motion`)
- Lucide React icons

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Set your `GEMINI_API_KEY`

3. Run the app:
   ```bash
   npm run dev
   ```

## Authentication

The app includes a complete auth system:

- **Register** — Create an account with email, password, and security questions
- **Login** — Sign in with email and password
- **Forgot Password** — Recover your account via security questions
- **Reset Password** — Set a new password using a secure token
- **Protected Routes** — App content is only accessible when logged in

> **Note:** Authentication is currently handled client-side with localStorage for demo purposes. For production, connect to a real backend API.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove dist folder |
