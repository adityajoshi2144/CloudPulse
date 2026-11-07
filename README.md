# CloudPulse — Cloud Operations & Intelligent Auto-Scaling Platform

[![React](https://img.shields.io/badge/React-19.3-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg)](https://threejs.org)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-HPA_v2-326ce5.svg)](https://kubernetes.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

CloudPulse is a 2026 enterprise-grade Cloud Operations and Intelligent Auto-Scaling Platform engineered to solve unpredictable application traffic surges, server overload, black-box visibility gaps, inefficient resource allocation, and cascading microservice failures.

---

## 🏛️ System Architecture

```
                    [ Anycast Ingress / Global Traffic ]
                                    │
                                    ▼
                [ NGINX Edge Reverse Proxy (Port 80/5173) ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        [ React 19 Frontend ]               [ FastAPI Core Backend ]
      (Three.js 3D Observatory)             (WebSocket & REST Engine)
                  │                                   │
                  └─────────────┬─────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
  [ Auth Service ]      [ Order Service ]    [ Inventory Service ]
   (JWT / Sessions)     (Core Transactions)   (Catalog & Stock)
          │                     │                     │
          └─────────────┬───────┴─────────────┬───────┘
                        ▼                     ▼
             [ Redis Distributed Cache ] [ PostgreSQL 16 DB ]
                  (Sub-2ms L2 RAM)        (ACID Persistence)
                                │
                                ▼
              [ Prometheus & Grafana Observability ]
```

---

## ✨ Key Platform Capabilities

### 1. Executive Overview & Health Observability
- Aggregated real-time metrics: Throughput (RPS), P95 Latency, HTTP Error Rate, CPU & Memory utilization, Active Replicas, and Cache Hit Ratio.
- Live-updating historical charts with selectable observation windows (`1m`, `5m`, `15m`, `1h`, `24h`).
- Continuous cluster quorum calculation and health status evaluations.

### 2. High-Frequency Live Monitoring
- 1000ms-resolution metric streams for incoming load, round-trip response times, container memory quotas, and pod allocations.
- Real-time statistical anomaly detection indicators with visual warning thresholds.

### 3. Microservice Fleet Management & Pod Inspector
- Service registry (`api-gateway`, `auth-service`, `order-service`, `inventory-service`, `payment-service`, `postgres-db`, `redis-cache`).
- Live pod replica tracker displaying individual Pod IDs, node placement, IP assignments, restart counts, and status (`Running`, `CrashLoopBackOff`).
- Live container standard output logs stream (`stdout`/`stderr`) and rolling pod restarts.

### 4. Interactive 3D Cloud Infrastructure Observatory
- High-performance 3D visualization powered by Three.js and React Three Fiber.
- Live animated particle data-flows indicating ingress traffic volume and database query routing.
- Dynamically rendered pod clusters surrounding each microservice node matching actual replica counts.
- Health status color indicators (emerald for healthy, amber for heavy load, rose for critical).
- Click-to-inspect contextual side panel with instant rolling restarts and manual scale overrides.
- Lightweight 2D Architecture Topology fallback with the same live telemetry contracts.

### 5. Intelligent Horizontal Pod Auto-Scaler (HPA v2)
- Implements standard Kubernetes HPA formula:
  $$\text{desiredReplicas} = \lceil \text{currentReplicas} \times (\text{currentCPU} / \text{targetCPU}) \rceil$$
- Configurable target CPU utilization thresholds (default: 70%), minimum pods (2), and maximum bounds (10).
- Scale-up cooldown (15s) and scale-down stabilization window (30s) to prevent pod flapping.
- Transparent audit ledger detailing the mathematical trigger metric and reason behind every scaling decision.

### 6. Interactive Traffic Simulator & Load Generator
- 5 pre-configured traffic patterns:
  1. **Normal Traffic:** Steady baseline diurnal traffic (~150 RPS).
  2. **Sudden Traffic Surge:** Flash-sale spike (~600 RPS) to observe HPA autoscaling.
  3. **Sustained Heavy Load:** Tests cluster saturation and scale-out ceilings (~450 RPS).
  4. **Gradual Growth:** Linear ramp-up from baseline to peak over duration.
  5. **Traffic Reduction:** Sharp drop in requests to test scale-down stabilization.
- Real-time execution controls: Start, Pause, Resume, Stop.
- Live multi-dimensional timeline tracking RPS, latency, errors, CPU, and auto-scaled pod count.

### 7. Incident Management & Automated Root Cause Analysis (RCA)
- Controlled chaos engineering controls:
  - **Simulate Pod Crash:** Injects `CrashLoopBackOff` into `order-service`, surges error rates, and triggers P1 incident.
  - **Trigger Self-Healing:** Reconciles pod replica pool, restores healthy container, and marks incident resolved.
- Automated Root Cause Analysis (RCA) engine correlating metric spikes, readiness probes, and container logs with confidence scoring.

### 8. Distributed Cache Analytics & Live Benchmark
- Tracks Redis cache hits, misses, hit ratio %, allocated memory, and key evictions.
- **Working Live Benchmark:** Executes simultaneous requests against Redis cache vs uncached PostgreSQL query, returning measured millisecond timings, speedup factor, and latency reduction percentage.

### 9. Experiment Laboratory
- Comparative A/B benchmark comparing unoptimized baseline (1 replica, uncached) against optimized platform (HPA autoscaled, Redis L2 active).
- Measures throughput, median latency, P95 latency, error rate, and recovery MTTR.
- Exportable Markdown report generation.

### 10. SLO / SLA Governance & Audit Trail
- 30-day rolling reliability tracking, error budget remaining (98.4%), and multi-window burn rate indicators.
- Immutable operator action ledger logging all configuration mutations, simulation runs, and cluster actions.

---

## 🚀 Quickstart Guide (Local Student Machine)

CloudPulse is engineered with dual-mode drivers: it runs seamlessly on a local student development machine without external databases or Docker required, using embedded SQLite and high-speed in-memory Redis caching, or full multi-container Docker Compose.

### Option A: Local Dev Server (Zero Docker Required)

1. **Start the FastAPI Backend:**
   ```powershell
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *The backend will initialize embedded database and live telemetry loop.*

2. **Start the React Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

### Option B: Docker Compose Full Stack

To run the complete production-inspired multi-container environment (PostgreSQL 16, Redis 7, Prometheus, Grafana, Backend, Frontend):

```bash
docker-compose up --build
```

- **CloudPulse Dashboard:** [http://localhost:5173](http://localhost:5173)
- **FastAPI OpenAPI Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Prometheus Scraper:** [http://localhost:9090](http://localhost:9090)
- **Grafana Observability:** [http://localhost:3000](http://localhost:3000) (User: `admin` / Password: `admin`)

---

### Option C: Kubernetes (Kind / Minikube) Deployment

To deploy onto a local Kubernetes cluster with native Horizontal Pod Autoscaling (HPA v2):

```bash
# 1. Create Namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy Persistence
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# 3. Deploy CloudPulse Microservices
kubectl apply -f k8s/cloudpulse-backend.yaml
kubectl apply -f k8s/cloudpulse-frontend.yaml

# 4. Apply Kubernetes Horizontal Pod Autoscaler
kubectl apply -f k8s/cloudpulse-hpa.yaml

# 5. Apply Ingress & Prometheus ConfigMap
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/prometheus-configmap.yaml
```

---

## 🧪 Automated Testing

Run the automated backend test suite:

```powershell
cd backend
python -m pytest -v
```

The test suite validates:
- Health checks and dependency ping (`test_health_endpoint`)
- Executive overview aggregation (`test_metrics_overview`)
- Microservices registry and tier inventory (`test_services_list`)
- HPA policy updates and validation (`test_scaling_policies`)
- Simulator lifecycle start/pause/stop (`test_simulator_lifecycle`)
- Real cache vs uncached query benchmark (`test_cache_benchmark`)
- Chaos failure injection and self-healing recovery (`test_incidents_and_chaos`)

---

## 📋 Infrastructure Transparency Report

| Capability | Local Dev Mode | Docker Compose | Kubernetes (Kind/Minikube) |
| :--- | :--- | :--- | :--- |
| **REST APIs & WebSockets** | Genuine (FastAPI) | Genuine (FastAPI) | Genuine (FastAPI) |
| **3D WebGL Observatory** | Genuine (Three.js) | Genuine (Three.js) | Genuine (Three.js) |
| **Traffic Simulation** | Real Ingestion Loop | Real Ingestion Loop | Real Ingestion Loop |
| **Cache Benchmark** | Live Real Timing | Real Redis 7 | Real Redis 7 |
| **Persistence** | Embedded SQLite | PostgreSQL 16 | PostgreSQL 16 |
| **Auto-Scaling Engine** | CloudPulse Native HPA | CloudPulse Native HPA | Native Kubernetes HPA v2 |
| **Metrics Scraping** | Live /metrics endpoint | Prometheus v2.51 | Prometheus Operator |

---

## 🛡️ Security & Design Standards
- No hardcoded secrets; configuration read via Pydantic `SettingsConfigDict` and environment variables.
- Non-root container execution (`appuser:appuser`, UID 1000).
- CORS headers scoped and configurable.
- Keyboard accessible navigation (`Ctrl+K` / `⌘K` Command Palette).
- Accessible contrast ratios conforming to WCAG AA guidelines.
