# CloudPulse — Website Traffic Protection, Threat Monitoring & Automated Recovery Platform

CloudPulse is an enterprise-grade cloud operations and cybersecurity operations center (SOC) platform built with React 19, TypeScript, Vite, Tailwind CSS, Recharts, and Python FastAPI.

It monitors website infrastructure, observes incoming traffic, identifies abnormal traffic patterns, generates alerts, manages infrastructure scaling, and demonstrates automated threat mitigation and service recovery.

---

## ⚡ Core Purpose & Workflow

CloudPulse communicates this closed-loop autonomous protection workflow visually:

$$\text{MONITOR} \longrightarrow \text{DETECT} \longrightarrow \text{ALERT} \longrightarrow \text{ANALYZE} \longrightarrow \text{MITIGATE} \longrightarrow \text{SCALE} \longrightarrow \text{RECOVER}$$

1. **MONITOR**: Ingress gateway continuously measures live request throughput (RPS), latency percentiles (P95/P99), error rates, and host CPU/memory.
2. **DETECT**: Real-time traffic anomaly and risk engines identify abnormal request bursts and flood patterns.
3. **ALERT**: Immediate visual alerts, notification drawer events, and incident logs are triggered without operator latency.
4. **ANALYZE**: Multi-factor explainable root cause analysis (RCA) highlights evidence, baseline deviations, and affected services.
5. **MITIGATE**: Ingress shield activates rate-limiting filters (e.g. 20 req/s cap) to protect backend services.
6. **SCALE**: Native Horizontal Pod Autoscaler (HPA) algorithm dynamically provisions additional replica pods (2 → 4 pods) to absorb legitimate traffic surges.
7. **RECOVER**: Latency returns to baseline, HTTP error rates drop to 0%, and service health is fully restored.

---

## 🚀 Quick Start (One-Click)

Run `run.bat` or `python run.py` from the project root:

```powershell
.\run.bat
```

Or start the backend and frontend in separate terminals:

### 1. Backend Engine (FastAPI)
```powershell
Set-Location backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### 2. Frontend Console (React 19 + TypeScript + Vite)
```powershell
Set-Location frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

- **Website Protection Center**: [http://127.0.0.1:5174](http://127.0.0.1:5174)
- **FastAPI Interactive Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 🎓 Faculty Demonstration Walkthrough (60 Seconds)

To demonstrate the platform to university faculty:

1. Click the glowing **"START FACULTY DEMO"** button in the top navigation bar or sidebar (or visit [http://127.0.0.1:5174/?demo=true](http://127.0.0.1:5174/?demo=true)).
2. Walk the faculty through the 7 interactive stages:
   - **Step 1 (Monitor)**: Show normal website baseline traffic (~2-4 req/s), low latency (16ms), 2 active pods.
   - **Step 2 (Detect Load)**: Click "Execute Step 2 Action" to simulate a legitimate traffic spike (flash sale); observe the rising throughput wave and CPU climbing.
   - **Step 3 (Threat Detection)**: Click "Execute Step 3 Action" to dispatch abnormal burst/flood traffic; show Threat Level transition to `HIGH RISK / CRITICAL` with rule evidence.
   - **Step 4 (Alert & Escalate)**: Observe firing security alert `ALT-CRIT-99` and incident timeline logging.
   - **Step 5 (Mitigate & Scale)**: Show rate-limiting shield active and native HPA scaling pods from 2 to 4.
   - **Step 6 (Recover)**: System automatically levels load, latencies drop, error rate subsides to 0%, health status turns green.
   - **Step 7 (Audit & Report)**: Review the final executive report with peak metrics, mitigation actions, and audit logs.
3. Use the **Reset** button at any time to return the platform to nominal baseline state.

---

## 🛡️ Architecture & Verification

- **Backend Pytest Suite**: `python -m pytest -q` (13 tests passed)
- **TypeScript Typecheck**: `npx tsc --noEmit` (0 errors)
- **Production Build**: `npm run build` (Clean Vite build)
- **Safety Sandbox**: In-process ASGI simulation targeting `cloudpulse-test-service` only. External targets and uncontrolled flooding are prohibited by design.
- **Orchestration**: Clear architectural distinction between CloudPulse's native simulated HPA engine and production Kubernetes clusters.
