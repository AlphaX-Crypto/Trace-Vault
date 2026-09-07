# TRACEVAULT

Automated Blockchain Intelligence & VASP Attribution Engine for cybercrime investigation support. Developed by team AlphaX-Crypto for Smart India Hackathon 2026.

## Purpose

TRACEVAULT is an investigative intelligence platform that supports cybercrime investigations by analyzing suspicious cryptocurrency wallet addresses. It traces fund movements, identifies associated VASPs/entities, and calculates explainable risk and confidence scores, providing actionable intelligence to law enforcement.

## High-Level Architecture

```text
LEA INVESTIGATOR
       |
       v
REACT FRONTEND
       |
       | REST/HTTP
       v
NODE.JS APPLICATION BACKEND
       |
       +--------------------+
       |                    |
       v                    v
POSTGRESQL DATABASE    PYTHON INTELLIGENCE ENGINE
                            |
                            v
                    TRANSACTION NORMALIZER
                            |
                            v
                    NETWORKX GRAPH ENGINE
                            |
                            v
                    VASP ATTRIBUTION ENGINE
                            |
                            v
                    RISK / CONFIDENCE ENGINE
                            |
                            v
                    BLOCKCHAIN DATA ADAPTERS
                            |
                            v
                 BLOCKCHAIN DATA PROVIDERS
```

## Repository Structure

```
Trace-Vault/
├── frontend/             # React/Vite application (Shiva)
├── backend/              # Node.js/Express API (Kushma)
├── intelligence-engine/  # Python/FastAPI intelligence service (Sam, Divija)
├── database/             # PostgreSQL schema and migrations (Ganesh)
├── docs/                 # Architecture and technical documentation (Rithwik)
├── tests/                # Integration and end-to-end tests (Rithwik)
└── scripts/              # Setup and development scripts
```

## Team Responsibilities

- **Shiva**: Frontend (React/Vite, UI/UX, Graph visualization)
- **Sam**: Core Intelligence (Python/FastAPI, Orchestration, Normalization, Risk/Confidence)
- **Divija + Sam**: Graph Intelligence (NetworkX, BFS traversal, Path finding)
- **Kushma**: Application Backend (Node.js, Auth, Case management, SAHYOG integration)
- **Ganesh**: Database (PostgreSQL, Schema, Migrations)
- **Rithwik**: QE + Documentation (Testing, Docs, Architecture docs)

## Technology Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Intelligence Engine**: Python, FastAPI, NetworkX
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Development Setup

1. Copy `.env.example` to `.env` and fill in the required variables.
2. Ensure Docker and Docker Compose are installed.
3. Run `docker-compose up -d` to start the development environment.

## Git Workflow & Branching Strategy

We use a standard feature-branch workflow with two main branches:
- `main`: Production-ready code.
- `develop`: Integration branch for feature development.

**Rules**:
- No direct pushes to `main` or `develop`.
- All feature work must go through Pull Requests.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).

See `CONTRIBUTING.md` for more details.