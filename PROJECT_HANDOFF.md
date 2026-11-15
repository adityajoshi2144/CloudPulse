# CloudPulse project handoff

Progress is saved in the working tree and has not been committed.

## What is implemented

- Local-run launcher and VS Code task; local API/frontend use ports 8001 and 5174.
- Backend HTTP/host telemetry collection and health probes, with unavailable integrations identified instead of represented as live measurements.
- Bounded local-only traffic/stress scenarios, a stop/pause/resume flow, measured risk scoring with configurable weights/thresholds, and process-local simulation reports with CSV/PDF downloads.
- A measured-workload Experiment Lab replacing the old fabricated baseline/optimized comparison.
- Risk analysis, health, reports, and dependency-map pages; initial loading state; run/settings/navigation labels clarify local-only functionality.
- Unsupported Kubernetes scaling, service restart, pod-failure, recovery, seeded incident, and generated service-log paths are disabled or explicitly reported unavailable.
- README documents local startup and the current integration limitations.

## Verification run

- Backend: `python -m pytest -q` — **13 passed**.
- Backend Python modules: `python -m compileall -q app` — passed.
- Frontend: `npx tsc --noEmit -p tsconfig.json` — passed.
- Frontend: `npm run build` — passed. Vite notes an existing main bundle over 500 kB.
- Browser navigation checked for Risk Analysis, System Health, Reports, Experiment Lab, Attack & Stress Lab, Settings, Auto-Scaling, Service Catalog, Infrastructure Map, and Incidents.
- Local-only simulation and report CSV/PDF endpoints were exercised successfully. Unsupported manual scaling and pod-failure endpoints correctly returned 501.

## Remaining work / limitations

- Connect and verify a real Kubernetes API/HPA adapter before claiming pod monitoring or scaling.
- Connect per-service/container instrumentation, Redis/Prometheus where desired, service logs, and an incident source.
- Persist telemetry, risk configuration, and reports if they must survive API restarts.
- ML prediction/anomaly detection is not implemented or evaluated; risk scores are explainable threshold-based calculations, not an ML model.
- Build and test a genuine fixed-vs-reactive-vs-predictive scaling comparison only after those implementations and measurements exist.
- Review older pages/endpoints (for example cache, alerts, SLO, and audit) separately for any remaining seeded or non-persistent behavior.
- Run a complete faculty-demo walkthrough after restarting the app; external integrations and Docker/Kubernetes deployment were not verified.

## Start the project

Use the VS Code task **Run CloudPulse**, or run these in two PowerShell terminals:

```powershell
Set-Location backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

```powershell
Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5174
```

Open `http://127.0.0.1:5174`. API docs: `http://127.0.0.1:8001/docs`.

At handoff, the frontend responded on port 5174; the API was not listening on port 8001. Start the backend command above before using API-backed features.

Run checks:

```powershell
Set-Location backend
python -m pytest -q
Set-Location ..\frontend
npx tsc --noEmit -p tsconfig.json
npm run build
```

The application can be closed and reopened without losing these file edits. Telemetry and generated reports are process-local and are cleared when the API restarts.
