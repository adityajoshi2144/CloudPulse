# CLOUDPULSE — Comprehensive Faculty Demonstration & Presentation Guide

---

## 📋 Table of Contents
1. [Project Overview & Elevator Pitch](#1-project-overview--elevator-pitch)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Exact Startup & Verification Commands](#3-exact-startup--verification-commands)
4. [How to Confirm Services are Healthy](#4-how-to-confirm-services-are-healthy)
5. [The 5-Question Faculty Defense Framework](#5-the-5-question-faculty-defense-framework)
6. [7-Stage Live Demonstration Script & Walkthrough](#6-7-stage-live-demonstration-script--walkthrough)
7. [Module-by-Module Technical Deep Dive](#7-module-by-module-technical-deep-dive)
8. [Faculty Q&A Preparation & Defenses](#8-faculty-qa-preparation--defenses)
9. [Troubleshooting & Emergency Reset Procedures](#9-troubleshooting--emergency-reset-procedures)

---

## 1. Project Overview & Elevator Pitch

### What is CloudPulse?
**CloudPulse** is an enterprise-grade Website Traffic Protection and Cloud Operations Platform. It continuously observes incoming web traffic, calculates an explainable real-time **Security Verdict**, separates legitimate traffic spikes from malicious attacks, activates edge rate-limiting defense shields, dynamically scales infrastructure replicas, and demonstrates autonomous closed-loop service recovery.

### The Problem It Solves
Traditional monitoring tools (Prometheus, Grafana, Datadog) present dozens of raw graphs, counters, and alerts without providing operators or executives with a single definitive verdict. In an incident, operators must guess whether a traffic spike is a flash sale or a DDoS attack. CloudPulse eliminates ambiguity by answering:
1. **Is the website safe or at risk?**
2. **What did CloudPulse detect?**
3. **Why did it classify the traffic this way?**
4. **What action did it take?**
5. **Did the website recover?**

---

## 2. Prerequisites & System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux.
- **Python**: Version 3.10, 3.11, or 3.12 (with pip).
- **Node.js**: Version 18, 20, or 22 (with npm).
- **Web Browser**: Chrome, Edge, Firefox, or Safari.
- **Network Ports**:
  - `8001`: Python FastAPI Backend API Engine.
  - `5174`: React 19 + TypeScript + Vite Frontend Web Console.

---

## 3. Exact Startup & Verification Commands

### Method A: One-Click Launcher (Fastest)
From the project root directory in PowerShell:
```powershell
.\run.bat
```
*Or using Python:*
```powershell
python run.py
```
This launcher checks port availability, starts the FastAPI backend daemon, launches the Vite dev server, and automatically opens your browser at `http://127.0.0.1:5174`.

---

### Method B: Two Separate PowerShell Terminals

#### Terminal 1 — Backend API Engine (FastAPI)
```powershell
Set-Location "C:\Users\adity\OneDrive\Desktop\CloudPulse\backend"
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

#### Terminal 2 — Frontend Console (React 19 + TypeScript + Vite)
```powershell
Set-Location "C:\Users\adity\OneDrive\Desktop\CloudPulse\frontend"
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

---

## 4. How to Confirm Services are Healthy

Run this one-line verification command in PowerShell:
```powershell
python -c "import urllib.request; print('Backend Health:', urllib.request.urlopen('http://127.0.0.1:8001/api/health').status); print('Frontend Live:', urllib.request.urlopen('http://127.0.0.1:5174').status)"
```
**Expected Output:**
```
Backend Health: 200
Frontend Live: 200
```

- **Operations Center**: [http://127.0.0.1:5174](http://127.0.0.1:5174)
- **Interactive OpenAPI/Swagger Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 5. The 5-Question Faculty Defense Framework

When presenting to faculty, orient your presentation around these 5 core answers:

| Faculty Question | CloudPulse Answer | Technical Grounding |
| :--- | :--- | :--- |
| **1. Is the website safe or at risk?** | **SAFE** (Nominal Baseline & Recovered) | Ingress throughput is 2–4 req/s, P95 latency is <25ms, error rate is 0.0%, and risk score is 12/100 (`LOW RISK`). |
| **2. What did CloudPulse detect?** | **Traffic Surge & Abnormal Burst Flood** | Differentiated an initial visitor wave from an erratic, high-frequency burst attack pattern violating variance bounds. |
| **3. Why did it classify this way?** | **Multi-Factor Baseline Deviation** | Pure volume growth with uniform endpoints and 0% errors = `LEGITIMATE TRAFFIC SURGE`. Rapid pulse frequency + elevated errors = `SIMULATED ATTACK TRAFFIC`. |
| **4. What action was taken?** | **Shield Throttling & Simulated HPA** | CloudPulse Shield enforced a 20 req/s cap via ASGI middleware (HTTP 429), and native HPA scaled replicas from 2 to 4 pods. |
| **5. Did the website recover?** | **YES** | Error rate dropped to 0.0%, P95 latency normalized, Incident `INC-2026-081` was marked `RESOLVED`, and website health returned to `Healthy`. |

---

## 6. 7-Stage Live Demonstration Script & Walkthrough

Open the browser at `http://127.0.0.1:5174`.

### Step 1: Introduce CloudPulse & Show Baseline (Stage 1)
- **What to Click**: The page opens on the **Overview** page. Point to the glowing **"START FACULTY DEMO"** banner.
- **What to Say**:
  > *"Respected faculty, welcome to CloudPulse. CloudPulse is an autonomous Website Traffic Protection and Cloud Operations platform. Instead of confusing operators with dozens of disjointed metric charts, CloudPulse delivers one clear, explainable Security Verdict. Right now, our protected target `demo.cloudpulse.local` is operating under nominal baseline conditions. As you can see on the central Security Verdict Card, the risk is classified as **LOW RISK** with a score of 12/100. Throughput is healthy at ~2 to 4 requests per second, P95 response latency is under 25 milliseconds, and our worker pool has 2 active replicas."*
- **Visuals on Screen**:
  - Central Verdict Card: Green badge `LOW RISK`, Score `12/100`.
  - Traffic Classification: `NORMAL TRAFFIC`.
  - Website Health: `Healthy`.
  - Protection Status: `STANDBY (20 req/s cap)`.

---

### Step 2: Trigger Legitimate Traffic Surge (Stage 2)
- **What to Click**: Click the glowing button **`START FACULTY DEMO`**.
- **What Happens**: Stage 2 initiates. The simulator dispatches controlled visitor traffic (`pattern: spike`, 4 virtual users) to the local ASGI test route.
- **What to Say**:
  > *"Now, we initiate Stage 2: a legitimate visitor surge, simulating a seasonal flash sale or viral product campaign. Notice how the incoming request throughput wave immediately climbs from 2 up to 12 requests per second, and host CPU utilization rises. Crucially, look at the Security Verdict Card: CloudPulse classifies this as **LEGITIMATE TRAFFIC SURGE**. Because error rates remain at 0% and request distribution is uniform, CloudPulse does not falsely sound a panic alarm. High traffic volume alone is not treated as a cyberattack."*
- **Visuals on Screen**:
  - Stage indicator highlights **STAGE 2: DETECT LOAD**.
  - Throughput jumps to 10–14 req/s on the KPI card.
  - Verdict Card displays `LEGITIMATE TRAFFIC SURGE`.
  - Risk Level remains `LOW RISK` or `MEDIUM RISK` (<50).

---

### Step 3: Trigger Suspicious Burst Traffic (Stage 3)
- **What Happens**: Stage 3 initiates automatically. The simulator dispatches high-frequency burst traffic (`pattern: burst`, 8 virtual users) exceeding variance thresholds.
- **What to Say**:
  > *"Next, in Stage 3, CloudPulse experiences abnormal burst traffic. Notice the erratic pulses on the waveform graph. The anomaly detection engine measures rapid threshold breaches and discontinuous spikes. The Threat Engine immediately flags this as **SIMULATED ATTACK TRAFFIC**, and the Risk Score elevates to **HIGH RISK (74/100)**. The Detection Explanation explicitly informs the operator: 'Abnormal burst traffic flood observed with elevated variance exceeding baseline tolerance envelopes.'"*
- **Visuals on Screen**:
  - Stage indicator highlights **STAGE 3: DETECT ANOMALY**.
  - Verdict Card turns amber/rose: **`HIGH RISK` (Score: 74/100)**.
  - Traffic Classification updates to **`SIMULATED ATTACK TRAFFIC`**.
  - Explanation details abnormal pulse rate and threshold breaches.

---

### Step 4: Security Alert & Incident Generation (Stage 4)
- **What Happens**: Stage 4 automatically triggers alert `ALT-CRIT-99` and logs Incident `INC-2026-081`.
- **What to Say**:
  > *"In Stage 4, CloudPulse translates detection into automated operations. A high-priority security alert `ALT-CRIT-99` is dispatched to the SOC notification queue, and Incident `INC-2026-081` is formally opened in the incident management subsystem with severity P1-Critical. Operators receive immediate notification without manual triage latency."*
- **Visuals on Screen**:
  - Stage indicator highlights **STAGE 4: ALERT & ESCALATE**.
  - TopBar notification bell pulses red.
  - Section 4 logs incident creation.

---

### Step 5: Active Mitigation & Auto-Scaling (Stage 5)
- **What Happens**: Stage 5 enforces rate-limiting filters on the ingress gateway and executes simulated HPA scaling.
- **What to Say**:
  > *"Now observe Stage 5: Autonomous Dual-Layer Mitigation. First, CloudPulse Shield engages real in-process rate-limiting on the ingress gateway, capping throughput at 20 requests per second and rejecting excess burst requests with HTTP 429 Too Many Requests. Second, the native Horizontal Pod Autoscaler calculates CPU pressure and dynamically provisions additional replicas, scaling worker pods from 2 to 4 pods. This absorbs the traffic wave while protecting backend databases from saturation."*
- **Visuals on Screen**:
  - Stage indicator highlights **STAGE 5: MITIGATE & SCALE**.
  - Section 4 shows `[REAL ACTION]` Rate Limiting Shield Enforced.
  - Section 4 shows `[SIMULATED ACTION]` HPA Scaled Replicas 2 → 4 pods.
  - Protection Status pill turns green: `ENFORCED`.

---

### Step 6: Service Stabilization & Recovery (Stage 6)
- **What Happens**: The simulator stops, load levels off, latency settles, error rate drops to 0%, and Incident `INC-2026-081` is marked `RESOLVED`.
- **What to Say**:
  > *"In Stage 6, the threat has subsided and mitigation takes effect. Traffic returns to baseline envelopes, HTTP error rate settles at 0.00%, and P95 edge latency drops back below 25 milliseconds. The incident is automatically marked RESOLVED, and the website status turns green: HEALTHY. CloudPulse has completed the self-healing cycle."*
- **Visuals on Screen**:
  - Stage indicator highlights **STAGE 6: RECOVER**.
  - Latency returns to nominal baseline.
  - Incident status updates to `RESOLVED`.

---

### Step 7: Executive Faculty Demonstration Report (Stage 7)
- **What Happens**: The comprehensive **Faculty Demonstration Report** appears directly on screen.
- **What to Say**:
  > *"Finally, in Stage 7, CloudPulse compiles an executive audit report. It summarizes the initial risk score (12/100) versus final risk score, peak traffic (16.2 req/s), peak CPU (78%), mitigation events, and scaling actions. Most importantly, it gives faculty clean, bulleted answers to the 5 core questions confirming that the website was successfully protected, stabilized, and recovered."*
- **Visuals on Screen**:
  - Modal/Card: **Executive Faculty Demonstration Report**.
  - Telemetry comparison: Initial vs. Peak vs. Final state.
  - 5 clear executive answers ready for grading.

---

### Step 8: Reset to Baseline
- **What to Click**: Click the **`Reset Demo`** button in the controller banner.
- **What to Say**:
  > *"With one click on Reset Demo, the cluster clears demonstration alerts and incidents, restores replica counts back to 2 pods, and returns to a clean baseline state ready for the next evaluation."*

---

## 7. Module-by-Module Technical Deep Dive

### Module 1: Website Protection Center (Overview Page)
- **Purpose**: Central command center providing the primary Security Verdict.
- **Backend Component**: `app.services.risk_engine.py` & `app.core.telemetry_state.py`.
- **API Endpoint**: `GET /api/risk/verdict` & `GET /api/metrics/overview`.
- **Key Interactivity**: "START FACULTY DEMO" button, Pause/Resume/Stop/Reset controls, and "VIEW TECHNICAL DETAILS" collapsible drawer.

### Module 2: Traffic & Attack Simulator
- **Purpose**: Generates bounded in-process HTTP request workloads (normal, spike, burst, flood, resource, failure) against the isolated test target.
- **Backend Component**: `app.services.simulator_engine.py`.
- **API Endpoints**: `POST /api/simulator/start`, `POST /api/simulator/pause`, `POST /api/simulator/stop`, `GET /api/simulator/status`.
- **Safety Boundary**: Only targets in-process ASGI endpoint `/api/simulator/test-target`. External URLs are blocked by schema validation.

### Module 3: Threat & Risk Assessment Engine
- **Purpose**: Synthesizes multi-factor evidence (RPS, baseline deviation, burstiness, error rate, CPU, latency) into an explainable 0–100 score.
- **Backend Component**: `app.services.risk_engine.py`.
- **API Endpoint**: `GET /api/risk`, `GET /api/risk/config`, `PUT /api/risk/config`.
- **Explainability**: Returns contributing factors, threshold violations, and grounded textual explanations.

### Module 4: CloudPulse Shield (Rate Limiting Mitigation)
- **Purpose**: Real local enforcement layer throttling requests exceeding configured rate caps.
- **Backend Component**: `app.services.shield_service.py`.
- **API Endpoint**: `GET /api/shield/status`, `POST /api/shield/toggle-enforcement`.
- **Enforcement**: Checks incoming request frequency in a sliding 1-second window and returns HTTP 429 when limits are breached.

### Module 5: Horizontal Pod Autoscaler (HPA)
- **Purpose**: Evaluates resource saturation and provisions additional pods (2 → 4 replicas) to absorb visitor surges.
- **Backend Component**: `app.services.autoscaler.py`.
- **API Endpoint**: `GET /api/scaling/policies`, `GET /api/scaling/events`.
- **Labeling**: Transparently labeled as native simulated HPA algorithm.

### Module 6: Incident Management & Root Cause Analysis (RCA)
- **Purpose**: Tracks operational anomalies, assigns severities (P1/P2/P3), logs resolution timelines, and generates root cause analysis.
- **Backend Component**: `app.services.rca_service.py`.
- **API Endpoints**: `GET /api/incidents`, `GET /api/incidents/{id}/rca`.

### Module 7: Alerts & Notification Drawer
- **Purpose**: Real-time visual dispatching of firing alerts with acknowledgement and resolution workflows.
- **Backend Component**: `app.routers.alerts.py`.
- **API Endpoints**: `GET /api/alerts`, `POST /api/alerts/{id}/acknowledge`, `POST /api/alerts/{id}/resolve`.

---

## 8. Faculty Q&A Preparation & Defenses

### Question 1: "Why doesn't CloudPulse classify a 15 req/s traffic spike as a DDoS attack?"
**Your Answer**:
> *"In enterprise cybersecurity, high traffic volume alone is not proof of an attack. A flash sale or viral news post creates legitimate visitor surges. CloudPulse evaluates multi-factor evidence: if incoming requests are distributed uniformly, latency increases gracefully, and the HTTP error rate remains near 0%, CloudPulse classifies it as a **LEGITIMATE TRAFFIC SURGE**. Treating all surges as attacks would cause false-positive rate limiting against real paying customers."*

### Question 2: "Is the rate limiting real or simulated?"
**Your Answer**:
> *"CloudPulse Shield implements **real, active rate limiting** at the application ingress gateway. Using our `ShieldService` class integrated into our FastAPI route handlers, any request stream exceeding our 20 requests per second cap is actively rejected with HTTP 429 Too Many Requests. The simulation aspect applies only to our Kubernetes pod scaling, which is honestly identified as a simulated HPA engine because we are running in a lightweight development environment without a live multi-node Kubernetes cluster."*

### Question 3: "How does CloudPulse calculate the 0–100 Risk Score?"
**Your Answer**:
> *"CloudPulse uses an explainable weighted multi-factor scoring model. We normalize measured host CPU utilization, P95 latency percentiles, HTTP error rates, and request rate anomalies against baseline measurements. Each factor is multiplied by its configured weight. If evidence is insufficient, CloudPulse returns `INSUFFICIENT DATA` rather than assuming safety. We do not make false claims of machine-learning models where simple, transparent threshold mathematics are used."*

### Question 4: "Why did you build both a WebSocket and REST endpoints?"
**Your Answer**:
> *"CloudPulse uses a dual-channel architecture. REST endpoints handle deterministic operations like starting simulations, updating scaling bounds, and fetching reports. The WebSocket connection at `/ws/telemetry` provides a real-time 1-second push stream for cluster overview and waveform updates, eliminating high-frequency HTTP polling overhead while maintaining automatic polling fallback if the socket disconnects."*

---

## 9. Troubleshooting & Emergency Reset Procedures

### If Port 8001 or 5174 is in Use:
Find and terminate stale processes in PowerShell:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8001).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 5174).OwningProcess | Stop-Process -Force
```
Then restart using `.\run.bat`.

### To Reset Demo State Instantly:
1. Click the **`Reset Demo`** button in the homepage controller banner.
2. Or execute via terminal:
```powershell
python -c "import urllib.request; urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8001/api/demo/reset', data=b'{}', headers={'Content-Type': 'application/json'}, method='POST'))"
```

### To Run Regression Verification Suite:
```powershell
Set-Location backend
python -m pytest -q
```
**Expected**: `18 passed in ~3.5s`.
