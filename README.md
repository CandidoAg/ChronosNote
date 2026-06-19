# ChronosNote ⏳🧠

An open-source, AI-powered offline-first workspace built with .NET 8, Hangfire, React, and Ollama that effortlessly turns written notes into scheduled background tasks.

---

## 🚀 Project Roadmap & Tech Stack

This project is split into focused development phases to track progress and architecture scaling.

### 🔲 Phase 0: Architecture & Initialization (Current)
* [x] Define Monorepo structure.
* [x] Initialize React 18 + Vite + TypeScript + Tailwind frontend wrapper using `pnpm`.
* [x] Set up .NET 8 Web API solution with decoupled layers (`Api`, `Core`, `Infrastructure`).
* [x] Configure global Git workspace.

### 🔲 Phase 1: Core Notion Clone Workspace
* [x] Configure EF Core + SQLite in the Backend.
* [ ] Build DB Schema for Rich Text Notes.
* [ ] Integrate **TipTap/Lexical** editor into the React frontend.
* [ ] Implement full CRUD API endpoints for real-time document autosaving.

### 🔲 Phase 2: Task Scheduler Integration via Hangfire
* [ ] Inject **Hangfire** backed by SQLite for background queues.
* [ ] Create custom text/slash commands in the editor to capture triggers (e.g., `/remind Monday 10am`).
* [ ] Build background workers using `BackgroundJob.Schedule` to dispatch notifications.
* [ ] Setup **SignalR** hubs for real-time frontend alert dispatching.

### 🔲 Phase 3: Privacy-First Local AI Engine (Ollama)
* [ ] Set up local integration with **Ollama** using lightweight models (`Llama-3.2-3b` or `Qwen2.5-1.5B`).
* [ ] Code advanced system prompting in .NET to enforce strict JSON schemas for unstructured text processing.
* [ ] Build contextual context-menus in the UI: "Summarize text", "Extract Actionable Items", and "Improve Tone".

---

## 🛠️ Architecture Setup

```text
ChronosNote/
├── ChronosNote.sln                 # Global .NET Solution File
├── src/
│   ├── client/                     # FRONTEND (React + Vite + TS + Tailwind + pnpm)
│   └── server/                     # BACKEND (.NET 8 Web API Layers)
│       ├── ChronosNote.Api/        # API Layer (Controllers, Middlewares, SignalR Hubs)
│       ├── ChronosNote.Core/       # Domain Layer (Entities, Rules, Interfaces)
│       └── ChronosNote.Infrastructure/ # Data Access Layer (EF Core, Hangfire, Ollama Client)
```

---
## ⚙️ Getting Started
### Prerequisites
* [.NET 8 SDK](https://dotnet.microsoft.com/download)
* [Node.js (v18+)](https://nodejs.org/) & [pnpm](https://pnpm.io/)
* [Ollama](https://ollama.com/) *(Required later for Phase 3 local AI processing)*

### Execution
#### 1. Running the Backend
From the root folder, navigate to the API layer and run the server:
```bash
cd src/server/ChronosNote.Api
dotnet run
```

The server will initialize by default on http://localhost:5000 (or the port specified in your launchSettings.json).

#### 2. Running the Frontend
From the root folder, navigate to the client workspace, install dependencies, and start the Vite development server:

```bash
cd src/client
pnpm install
pnpm dev
```
Open http://localhost:5173 in your browser to view the application.

---
## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
