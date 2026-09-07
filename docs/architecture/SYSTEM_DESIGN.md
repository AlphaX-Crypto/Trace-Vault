# System Architecture

## Component Separation

The TRACEVAULT system enforces strict boundaries between its primary components to ensure scalability, security, and maintainability.

### 1. Frontend (React)
- **Responsibility**: UI, User interaction, Visualization, API consumption.
- **Constraints**: 
  - Must NOT directly access the PostgreSQL database.
  - Must NOT interact with Blockchain APIs directly.
  - Must NOT contain private keys or intelligence engine internals.

### 2. Node.js Backend
- **Responsibility**: Authentication, Case management, Application APIs, Request orchestration, SAHYOG workflow.
- **Constraints**: 
  - Acts as a gateway and business logic orchestrator for application features.
  - Communicates with the Python Intelligence Engine via defined REST API contracts.

### 3. Python Intelligence Engine
- **Responsibility**: Blockchain analysis, Transaction normalization, Graph analysis, VASP attribution, Risk analysis, Confidence scoring.
- **Note**: NetworkX is an internal module within this engine, NOT a separate standalone backend or service.

### 4. Database (PostgreSQL)
- **Responsibility**: Persistent storage for application data (cases, users) and investigation data (cached entities, VASP data).
- **Constraints**: 
  - Must not contain complex business logic (e.g., avoid heavy stored procedures for graph logic).
