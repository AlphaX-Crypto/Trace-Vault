# TRACEVAULT — VIDEO REFERENCE ANALYSIS & DESIGN SYSTEM SPECIFICATION
**Source of Truth Extraction Document**  
*Document Version:* 1.0.0  
*Date:* September 29, 2026  
*Status:* Complete (Phase A Deliverable)

---

## EXECUTIVE SUMMARY

This document extracts the complete visual, motion, spatial, and interaction language from the two primary reference assets in `SIH/reference/`:

1. **Video 1 (`f7934251a91a55a3b1bfa856db8f0d53.mp4`)**: Complete Theme, Cinematic Hero, High-Contrast Typography, Scramble Reveal, Tech Frame Shell, and Modular Grid.
2. **Video 2 (`graph.mp4`)**: Institutional Graph Intelligence Platform (Fuselab Policy Platform), Force/Constellation Graph Layout, Radial Bezier Tree Layout, Fluid Hop Traversal, Interactive Inspector, and Real-time Telemetry.

This analysis establishes the strict design rules that govern the rebuilt TRACEVAULT frontend. Every visual decision follows the chain:
$$\text{REFERENCE OBSERVATION} \longrightarrow \text{DESIGN RULE} \longrightarrow \text{TRACEVAULT IMPLEMENTATION}$$

---

## 1. VIDEO 1 BREAKDOWN (HERO & COMPLETE THEME)

### 1.1 First Frame & Initial Composition
- **Canvas Environment:** Centered presentation viewport framed inside a dark canvas. The viewport container has a soft rounded corner radius (~16px) with an ultra-thin 1px obsidian hairline border (`#16222f`).
- **Background Treatment:** Pure deep black base (`#030708` to `#060b11`) with a subtle atmospheric deep-teal/cobalt radial bloom behind the central focus object. An ultra-faint spatial grid texture and particulate dust field is visible at ~4% opacity.
- **Top Header Bar:**
  - Left: Minimal uppercase wordmark (`ZQL`).
  - Center: Chamfered technical frame bar containing uppercase category items (`TECHNOLOGY`, `PRODUCTS`, `ECOSYSTEM`, `ABOUT`). Each item is underlined by a subtle 2px accent indicator.
  - Right: Technical button `EXPLORE ZQL` with chamfered corner cut and corner plus symbol (`+`).
- **Hero Typography (Left-Heavy, High Negative Space):**
  - Eyebrow: `UNBREAKABLE ▮▮▮ SECURITY` in high-tracking uppercase technical monospace.
  - Main Headline (3 stacked lines):
    - Line 1: `The most` (Pure White `#ffffff`, high contrast, semi-bold sans-serif).
    - Line 2: `secure blockchain` (Dynamic focal blur transition; `secure` has gaussian optical blur while `blockchain` is crisp).
    - Line 3: `by quantum design` (Medium-grey `#64748b` to `#475569`, providing tonal hierarchy).
- **CTA Element:** Crisp white high-contrast pill button (`Explore ZQL +`) in bottom right quadrant.

### 1.2 Appearance Timing & Motion Choreography
- **0.00s - 0.73s (Scramble & Boot):** Typography does not fade in generically. Text items experience a high-speed cryptographic character scramble (`BS O` $\rightarrow$ `ZQL`, `UFDIOPNQ1A` $\rightarrow$ `TECHNOLOGY`).
- **0.75s - 2.50s (Focal Settle):** The central monolithic anchor stabilizes while the headline text resolves with staggered character unblurring.
- **3.00s - 8.00s (Scroll / Section Pivot):** Hero smoothly transitions upwards with ease-out cubic motion ($T = 600\text{ms}$). The top bar remains pinned. The next section slides into view: `Future-Proof Reliability` with centered icon triad (`PQ MESSAGING`, `ENTERPRISE INTEGRATION`, `DIGITAL ASSET SECURITY`).
- **11.00s - 18.00s (Feature Cards):** Deep dark cards with 1px border highlights, subtle inner glass refraction, and card header micro-tags (`• PQ MESSAGING`, `• ENTERPRISE INTEGRATION`).

---

## 2. VIDEO 2 BREAKDOWN (INSTITUTIONAL GRAPH PLATFORM)

### 2.1 Spatial Structure & Navigation Shell
- **Top Global Command Bar:**
  - Left: Platform identifier (`Control AI Policy Platform`) with a stylized geometric shield/star emblem.
  - Center: Floating segmented pill toolbar containing:
    1. Constellation / Network graph mode icon (active in 04.00s - 11.00s).
    2. Radial Tree / Hierarchy fan-out mode icon (active in 00.00s - 03.50s & 12.00s - 21.00s).
    3. Zoom In (`+`) and Zoom Out (`-`).
    4. Filter tool with numerical badge (`5`).
    5. Sort / Grouping tool with numerical badge (`2`).
    6. AI / Intelligence sparkle action button.
  - Right: `+ New Simulation` action pill, Theme Toggle (dark/light crescent), Search icon, and Investigator profile avatar.
  - Contextual Sub-bar: Floating subtle pill displaying active target context: `KPI overview UAE law 42/2022 public complaints and AI analysis`.

### 2.2 Radial Tree / Hierarchy Fan-Out View (00.00s - 03.50s, 12.00s - 21.00s)
- **Root Node (Origin Entity):**
  - Spherical 3D shaded orb (violet/lavender core with dynamic rippling sonic/frequency waves radiating outwards).
  - Label: `Federal Decree-Law No. 45 of 2021` with secondary tag `GAPS 12` and sentiment metric bar.
- **Level 1 Category Columns (Bridge Hubs):**
  - Smooth Bezier curves extend horizontally rightward from root into rounded category pill nodes:
    - `💼 18 Services`
    - `🏢 3 Entities`
    - `⚖️ 24 Related Federal Laws` (Selected state: highlighted with luminous gold/amber border and inner glow).
    - `🛡️ 32 KPIs`
    - `📋 12 Related Federal Laws`
- **Level 2 Leaf Distribution (Fan-Out):**
  - Radiating fan of 15+ organic Bezier curves flowing from the active Level 1 hub toward individual downstream entities.
  - Each leaf node contains:
    - Glowing dot indicator (color-coded by risk/sentiment).
    - Truncated institutional title (`Bank of New York...`, `Emirates Citigroup...`, `Capital One...`).
    - Telemetry chip: `GAPS 12%`, `GAPS 25%`.
    - Horizontal status bar (green/yellow/red).
  - Depth of field falloff: Nodes above and below the focal center fade gradually in opacity (down to ~20%).

### 2.3 Constellation / Force-Directed Graph View (04.00s - 11.50s)
- **Central Core:** Major hub `Constitution 47%` with golden radial rays radiating light beams directly to major domain clusters (`Government affairs`, `Security and safety`, `Healthcare`, `Education`, `Justice and Judiciary`).
- **Interactive Time-Travel Rail (Left Margin):**
  - Vertical timeline from `2017` to `2024`.
  - Selected year `2020` in an oval badge, linked to a vertical frequency/sparkline waveform in the extreme left margin.
- **Floating Legend Card (Bottom Left):**
  - High-precision glass pill summarizing node types: `1 Constitution`, `11 Entities`, `18 Legislation`, `53 Services`, `61 Regulations`.
- **Bottom Telemetry & Investigation Query Bar:**
  - Horizontal metrics bar: `Compliance Rate 98%`, `Total Laws 165K`, `Public Engagement 165K`, `Implementation Rate 57%`.
  - Integrated natural-language command input: `Ask a question...` / `Analyze Federal Decree-Law...` with agent selector dropdown (`My agent`) and action trigger (`RI Analysis`).

### 2.4 Inspector Panel (Right Drawer)
- High-contrast slide-in analytical dossier panel:
  - Header: Category icon + `Healthcare` tag.
  - Title: Full legal/entity title: `Federal Decree-Law No. (42) of 2022 Promulgating the Civil Procedure Code`.
  - Status chip: `Active`, last update date, and `Explore details >` primary button.
  - Metric Card: `Sentiment Rate 45%` with inline vertical histogram and status chip `Moderate`.
  - 2x2 Metric Grid: `12 Public Complains`, `2 Related Regulations`, `18 Services`, `12 Entities Involved`.
  - Intelligence Finding Card: `Propose De-regulation` with contextual analysis.

---

## 3. VISUAL DESIGN SYSTEM

### 3.1 Surface & Elevation
- **OBSERVATION:** Reference videos use layered darkness rather than a single flat black. Panels have subtle transparency (`rgba(11, 20, 28, 0.85)`), hairline borders (`1px solid rgba(255, 255, 255, 0.08)`), and soft radial gradients behind focal points.
- **DESIGN RULE:** 4-tier surface elevation:
  - Base: `#050a0e` (Canvas background)
  - Surface Tier 1: `#0a1219` (Sidebars, global navigation)
  - Surface Tier 2: `#0e1822` (Cards, inspector panels)
  - Surface Tier 3: `#142230` (Selected rows, active tabs, hover states)
- **TRACEVAULT IMPLEMENTATION:** CSS custom properties defined in `:root` and `.dark`, using strict institutional borders (`border: 1px solid var(--border-subtle)`).

### 3.2 Accents & Status
- **OBSERVATION:**
  - Video 1 uses pure white (`#ffffff`) for dominant elements and cold quantum cyan (`#00f0ff` / `#24c7c9`) for subtle glows.
  - Video 2 uses warm amber/gold (`#e5b964`) for constitutional/origin hubs, vibrant cyan (`#22d3ee`) for services and links, purple (`#a855f7`) for entities, and crimson (`#ef4444`) for critical concerns.
- **DESIGN RULE:**
  - Primary Brand/Focus: Cyan `#24c7c9` / `#00f0ff`.
  - Root / Anchor Entity: Golden Amber `#f59e0b` / `#e5b964`.
  - Risk / Alert High: `#ef4444` (Critical).
  - Risk Medium / Suspicious: `#f59e0b` (Moderate).
  - Verified / Compliant: `#10b981` (Low Risk).
  - Entity Category: Violet `#a855f7`.

---

## 4. TYPOGRAPHY SYSTEM

### 4.1 Typeface Selection
- **OBSERVATION:** Clear dual-typography hierarchy. Clean geometric sans-serif for UI labels and editorial titles; high-precision monospace for technical numbers, IDs, telemetry, and dates.
- **DESIGN RULE:**
  - Primary UI & Headlines: **Inter** (sans-serif)
  - Forensic Identifiers, Hashes, Telemetry, Code: **JetBrains Mono** / **SF Mono** (monospace)

### 4.2 Hierarchy Scale
| Role | Font | Size | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Hero Headline | Inter | 56px - 64px | 600 (SemiBold) | -0.03em | Sentence case |
| Section Title | Inter | 28px - 32px | 500 (Medium) | -0.02em | Sentence case |
| Inspector Title | Inter | 18px - 20px | 600 (SemiBold) | -0.01em | Title case |
| Eyebrow / Tag | JetBrains Mono | 11px - 12px | 500 (Medium) | +0.12em | UPPERCASE |
| Body UI | Inter | 13px - 14px | 400 (Regular) | 0.00em | Regular |
| Telemetry / Hashes | JetBrains Mono | 12px - 13px | 400 / 500 | +0.02em | Mixed / Upper |

---

## 5. SPACING & GRID SYSTEM

- **Base Unit:** 4px (All padding, margins, and gaps are multiples of 4: 8px, 12px, 16px, 20px, 24px, 32px, 48px).
- **Global Layout:** 
  - Fixed top bar height: `56px`.
  - Breadcrumb / context header: `40px`.
  - Workspace canvas: Fluid 100vh minus headers.
  - Inspector drawer width: `420px` (desktop default).
- **Negative Space:** Reference videos heavily emphasize intentional empty space around central focal nodes. Elements are not packed edge-to-edge; margins breathe.

---

## 6. MOTION PRINCIPLES & ANIMATION CHOREOGRAPHY

### 6.1 Easing Curves
- **Standard UI Transitions:** `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration, $300\text{ms}$).
- **Graph Camera Pan / Zoom:** `cubic-bezier(0.25, 1, 0.5, 1)` ($600\text{ms} - 800\text{ms}$).
- **Photon / Light Pulse Traversal:** `cubic-bezier(0.4, 0, 0.2, 1)` ($1200\text{ms} - 1500\text{ms}$).

### 6.2 Graph Interaction & Hop Traversal
- **OBSERVATION:** Edges do not simply appear instantly. In Video 2:
  1. A parent node is clicked.
  2. The parent node acquires a luminous golden/cyan boundary stroke.
  3. Light pulses (photons) travel outwards along curved Bezier splines from parent to children.
  4. Children nodes unroll into view with staggered delay ($40\text{ms}$ per child).
  5. The right inspector panel slides into view with synchronized data.
- **TRACEVAULT IMPLEMENTATION:**
  - Real NetworkX traversal data from FastAPI backend (`/api/v1/graph/trace`) triggers staged SVG / Canvas particle animation.
  - Hovering a node dims unrelated branches and highlights the direct investigative path.

---

## 7. HERO SEQUENCE & APPLICATION TRANSITION

### 7.1 The Hero Sequence
1. **Frame 0 (0.0s - 0.8s):** Minimal viewport with cryptographic scramble text effect across wordmark `TRACEVAULT` and status indicators.
2. **Frame 1 (0.8s - 2.5s):** Hero headline resolves:
   - Line 1: `Autonomous forensic intelligence` (High contrast `#ffffff`).
   - Line 2: `cross-chain financial tracing` (Focal blur reveal).
   - Line 3: `for institutional investigations` (Muted slate `#94a3b8`).
   - Central visual: Multi-dimensional topological ledger core with subtle rotational breathing.
3. **Action Trigger:** Primary CTA `Launch Investigation Console` or `Access Registry` triggers camera zoom-in transition.
4. **Transition into Product (2.5s+):** The hero topological core expands outward; canvas background cross-fades into the Case Registry workstation.

---

## 8. GRAPH ANIMATION SEQUENCE & SPECIFICATION

### 8.1 Dual Mode Graph Architecture
1. **Mode A: Radial Tree / Flow View (Investigative Hop Analysis)**
   - Root target address / transaction on the left.
   - Column of intermediate hops / cluster hubs (Exchange, Mixer, VASP, Mule Account).
   - Downstream beneficiary wallets and withdrawal endpoints fanned out with Bezier connections.
2. **Mode B: Constellation / Topology View (Multi-Entity Network)**
   - Force-directed layout of connected clusters.
   - Primary target illuminated with amber aura.
   - Flow directions visualized with animated particle strokes along transaction edges.

### 8.2 Inspector Dossier
- Clicking any node opens the Institutional Inspector:
  - **Entity / Wallet Name & Address** (with copy button & Section 65B hash).
  - **Risk Score Badge** (0-100 gauge with risk classification).
  - **Direct Telemetry:** Total Received, Sent, Balance, First/Last Active.
  - **Attribution & VASP Identification:** Known entity matching from intelligence engine.
  - **Action Tools:** `Expand 1-Hop`, `Trace Source`, `Generate Section 91 Notice`, `Add to Case Evidence`.

---

## 9. THINGS EXPLICITLY NOT PRESENT IN THE REFERENCES

To prevent design regression, the following anti-patterns observed in generic dashboards are **strictly prohibited**:
1. ❌ **No generic 4-card metric grids filling the top of every screen.**
2. ❌ **No neon rainbow gradients or purple glow everywhere.**
3. ❌ **No random particle networks or floating stars that have no investigative meaning.**
4. ❌ **No cartoonish badges or giant "AI Powered" marketing stickers.**
5. ❌ **No cluttered all-in-one screens that mix graphs, tables, forms, and charts simultaneously.**
6. ❌ **No default React Flow gray grid with blue rectangular nodes.**

---

## 10. TRACEVAULT IMPLEMENTATION MAPPING

| Forensic Task | Reference Model | TRACEVAULT Implementation | Backend API Contract |
|---|---|---|---|
| Platform Launch | Video 1 Hero & Scramble | `features/hero/CinematicHero.tsx` | N/A (Frontend Motion) |
| Investigator Auth | Video 1 Tech Form Shell | `features/auth/AuthScreen.tsx` | `POST /api/auth/login` |
| Case Registry | Clean Institutional Workstation | `features/cases/CaseRegistry.tsx` | `GET /api/cases` |
| Case Creation | Modal / Dedicated Workflow | `features/cases/CreateCaseModal.tsx` | `POST /api/cases` |
| Investigation Shell | Video 2 Navigation & Toolbar | `features/investigation/InvestigationShell.tsx` | `GET /api/cases/:id` |
| Graph Investigation | Video 2 Constellation & Radial Tree | `features/graph/ForensicGraphWorkspace.tsx` | `POST http://127.0.0.1:8000/api/v1/graph/trace` |
| Node Dossier | Video 2 Right Inspector Drawer | `features/graph/NodeInspector.tsx` | `GET /api/investigations/:id/nodes/:nodeId` |
| Evidence Capture | Video 2 Action Toolbar | `features/evidence/EvidenceRegistry.tsx` | `POST /api/evidence` |

---

## 11. CONCLUSION & PHASE A SIGN-OFF

The visual and motion language from both reference videos has been systematically analyzed and documented without substitution.

**Phase A is complete.**  
Phase B (Design Foundation + Hero Implementation + Visual Verification) will commence immediately.
