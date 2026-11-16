# CloudPulse — Website Traffic Protection & Cloud Operations Platform

CloudPulse is an enterprise-grade cloud operations and cybersecurity operations center (SOC) platform built with React 19, TypeScript, Vite, Tailwind CSS, Recharts, and Python FastAPI.

It delivers **one clear, explainable Security Verdict** for protected web applications, distinguishes legitimate visitor traffic surges from malicious attacks, manages horizontal auto-scaling, enforces edge rate limiting, and demonstrates autonomous closed-loop mitigation and service recovery.

---

## ⚡ The Core Security Verdict

CloudPulse eliminates metric overload by providing **One Clear Final Security Verdict**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ CLOUDPULSE SECURITY VERDICT: LOW RISK (Score: 12/100)                  │
│                                                                        │
│ Classification: NORMAL TRAFFIC       Website Health: Healthy          │
│ Status: Monitoring Active            Enforcement: Rate Limit Standby  │
│                                                                        │
│ Detection Explanation (WHY):                                           │
│ Website is operating normally. Ingress traffic (2.4 req/s), latency,   │
│ and host CPU (28.4%) are within safe baseline envelopes with zero      │
│ significant threats detected.                                          │
│                                                                        │
│ Recommended Action: Continue continuous monitoring.                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Risk Level Standards (Calculated, Never Hardcoded):
- **0–24: LOW RISK** — Traffic is within expected baseline behavior; no significant suspicious indicators.
- **25–49: MEDIUM RISK** — Unusual traffic or elevated resource load present; monitoring continues.
- **50–74: HIGH RISK** — Multiple suspicious indicators exist (burst spikes, error surges); active mitigation required.
- **75–100: CRITICAL RISK** — Severe malicious flood or endpoint failure combined with critical operational impact.
- **INSUFFICIENT DATA** — Inadequate samples to establish baseline confidence.

### Clear Traffic Classifications:
1. `NORMAL TRAFFIC` — Expected baseline visitor traffic.
2. `LEGITIMATE TRAFFIC SURGE` — High-volume visitor spike (e.g. flash sale) where requests are uniform and error rates remain nominal. Security risk remains LOW / MEDIUM (high traffic volume alone is not an attack).
3. `SUSPICIOUS TRAFFIC` — Rapid traffic growth accompanied by abnormal endpoint concentration or elevated HTTP 4xx/5xx errors.
4. `SIMULATED ATTACK TRAFFIC` — Controlled high-frequency burst or flood patterns triggered in the safe local simulation sandbox.
5. `UNKNOWN / INSUFFICIENT EVIDENCE` — Missing measurements.

---

## 🏛️ Main Output Architecture

The CloudPulse homepage is strictly organized into 5 prioritized sections:

1. **SECTION 1 — FINAL SECURITY VERDICT CARD**:
   Large prominent hero card with Overall Risk Level, Risk Score (0-100), Website Health, Traffic Classification, Detection Explanation (WHY), Recommended Action, Mitigation Status (WHAT ACTION), and Last Analysis Time.
2. **SECTION 2 — WEBSITE HEALTH**:
   Availability (99.98%), Response Time P95, Current Ingress Throughput (RPS), HTTP Error Rate (%), and Protection Status.
3. **SECTION 3 — WHAT CLOUDPULSE DETECTED**:
   Clear finding list explaining each detected indicator (Throughput, Anomaly, CPU, Error Rate) and its operational impact.
4. **SECTION 4 — WHAT CLOUDPULSE DID**:
   Transparent action log distinguishing **[REAL ACTION]** (Shield rate limiting, incident creation), **[SIMULATED ACTION]** (Native HPA pod scaling), and **[RECOMMENDED ACTION]**.
5. **SECTION 5 — TECHNICAL DETAILS**:
   Collapsible section revealing live Recharts waveform graphs, raw host metrics (psutil), replica distribution, and service catalog tables.

---

## 🎓 One-Click Faculty Demonstration

CloudPulse features a prominent **"START FACULTY DEMO"** controller directly on the homepage and top navigation bar.

When clicked, it automatically runs through all 7 stages sequentially:

- **STAGE 1 — BASELINE MONITORING**: Normal ingress (~2-4 req/s), low latency (<25ms), healthy host CPU, 2 active pods, LOW RISK verdict.
- **STAGE 2 — TRAFFIC SURGE**: Simulator launches a legitimate visitor spike (`pattern: spike`); RPS climbs to 10-15 req/s. Correctly classified as **LEGITIMATE TRAFFIC SURGE (Low Security Risk)**.
- **STAGE 3 — SUSPICIOUS TRAFFIC SIMULATION**: Controlled burst pattern (`pattern: burst`); high-frequency pulses trigger threshold breaches. Risk score elevates to **HIGH RISK / CRITICAL (74/100)**.
- **STAGE 4 — SECURITY ALERT**: Critical alert `ALT-CRIT-99` fires and Incident `INC-2026-081` is logged into the SOC incident queue.
- **STAGE 5 — MITIGATION**: CloudPulse Shield enforces edge rate limiting (20 req/s cap; excess requests throttled with HTTP 429) and simulated HPA engine scales replicas from 2 to 4 pods.
- **STAGE 6 — RECOVERY**: Simulation completes, latencies drop back to <25ms, error rate drops to 0%, Incident is marked RESOLVED, and website status returns to HEALTHY.
- **STAGE 7 — FINAL REPORT**: Generates the comprehensive Faculty Report with answers to the faculty's 5 core questions:
  1. *Is the website safe or at risk?*
  2. *What did CloudPulse detect?*
  3. *Why did it classify the traffic this way?*
  4. *What action did it take?*
  5. *Did the website recover?*

### Demo Controls:
- `Start Demo` — Starts the automated 7-stage demonstration.
- `Pause Demo` / `Resume Demo` — Temporarily pauses/resumes progression for faculty explanations.
- `Stop Demo` — Halts the demonstration immediately.
- `Reset Demo` — Clears all demo alerts/incidents, resets replicas to 2, and restores clean baseline state.
- Duplicate simultaneous runs are prevented by the server-side state machine.

---

## 🚀 Quick Start (One-Click)

### Option A: Automatic Launcher
Run `run.bat` or `python run.py` from the project root:

```powershell
.\run.bat
```

Or:
```powershell
python run.py
```
This boots both the FastAPI backend and React frontend and automatically launches your browser.

---

### Option B: Separate Terminals

#### 1. Backend API (FastAPI)
```powershell
Set-Location backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

#### 2. Frontend Console (React 19 + TypeScript + Vite)
```powershell
Set-Location frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

- **Operations Center**: [http://127.0.0.1:5174](http://127.0.0.1:5174)
- **FastAPI Interactive Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 🛡️ Architecture & Verification

- **Backend Pytest Suite**: `python -m pytest -q` — **18 passed** (100% test coverage for API, Risk Classification Engine, Rate Limiting Shield, and Faculty Demo Lifecycle).
- **Backend Python Compilation**: `python -m compileall -q app` — 0 errors.
- **Frontend TypeScript Typecheck**: `npx tsc --noEmit` — 0 errors.
- **Production Build**: `npm run build` — Clean Vite build.
- **Safety Sandbox**: In-process ASGI simulation targeting `cloudpulse-test-service` only. External targets and uncontrolled floods are strictly prohibited by design.
- **Honest Labeling**: Transparent distinction between real in-process ASGI rate limiting and simulated HPA pod scaling.
