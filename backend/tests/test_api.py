import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.telemetry_state import telemetry_state
from app.services.autoscaler import autoscaler_service
from app.services.simulator_engine import simulator_engine
from app.models.entities import SimulatorConfig
from app.core.metrics_collector import metrics_collector

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert "database" in data["checks"]
    assert "cache" in data["checks"]
    assert data["checks"]["database"]["status"] == "connected"
    assert data["operational_state_persistent"] is False
    assert data["checks"]["orchestration"]["status"] in {
        "disabled",
        "not_integrated",
    }
    assert data["checks"]["prometheus"]["status"] in {
        "connected",
        "unavailable",
    }

@pytest.mark.asyncio
async def test_metrics_overview():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/metrics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_rps" in data
    assert "p95_latency_ms" in data
    assert "cpu_utilization_percent" in data
    assert "active_replicas" in data
    assert data["metrics_source"] == "CloudPulse HTTP middleware and host psutil"

@pytest.mark.asyncio
async def test_http_metrics_are_measured_and_exported():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        before = metrics_collector.total_requests
        response = await ac.get("/api/services")
        assert response.status_code == 200

        overview = await ac.get("/api/metrics/overview")
        assert overview.json()["total_requests"] >= before + 1

        exported = await ac.get("/metrics")
        assert exported.status_code == 200
        assert "cloudpulse_http_requests_total" in exported.text

        invalid_range = await ac.get("/api/metrics/history?range=24h")
        assert invalid_range.status_code == 400

@pytest.mark.asyncio
async def test_services_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/services")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    ids = [s["id"] for s in data]
    assert "api-gateway" in ids
    assert "order-service" in ids

@pytest.mark.asyncio
async def test_scaling_policies():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/scaling/policies")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 4
        order_policy = next(policy for policy in data if policy["service_id"] == "order-service")
        assert order_policy["is_hpa_active"] is False
        assert order_policy["current_replicas"] is None
        assert order_policy["execution_mode"] == "policy_only"
        
        # Update policy inside client context
        put_res = await ac.put("/api/scaling/policies/order-service", json={
            "target_cpu": 65,
            "min_replicas": 3,
            "max_replicas": 15,
            "scale_up_cooldown": 10,
            "scale_down_cooldown": 25
        })
        assert put_res.status_code == 200
        assert put_res.json()["policy"]["target_cpu"] == 65
        assert put_res.json()["infrastructure_changed"] is False

        invalid_bounds = await ac.put("/api/scaling/policies/order-service", json={
            "target_cpu": 65,
            "min_replicas": 15,
            "max_replicas": 3,
            "scale_up_cooldown": 10,
            "scale_down_cooldown": 25
        })
        assert invalid_bounds.status_code == 422

        manual_scale = await ac.post(
            "/api/scaling/manual?service_id=order-service&replicas=3"
        )
        assert manual_scale.status_code == 501
        assert "no Kubernetes adapter" in manual_scale.json()["detail"]

        restart = await ac.post("/api/services/order-service/restart")
        assert restart.status_code == 501

        logs = await ac.get("/api/services/order-service/logs")
        assert logs.status_code == 200
        assert logs.json()["available"] is False
        assert logs.json()["logs"] == []

@pytest.mark.asyncio
async def test_simulator_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/simulator/start", json={
            "pattern": "spike",
            "virtual_users": 2,
            "intensity": "low",
            "duration_seconds": 15,
            "max_requests": 10,
        })
        assert res.status_code == 200
        assert res.json()["is_running"] is True
        assert res.json()["safe_simulation_mode"] is True
        assert res.json()["target_service"] == "cloudpulse-test-service"
        assert res.json()["request_cap"] == 10

        status = await ac.get("/api/simulator/status")
        assert status.json()["is_running"] is True

        stop_res = await ac.post("/api/simulator/stop")
        assert stop_res.status_code == 200
        assert stop_res.json()["is_running"] is False
        assert stop_res.json()["scenario_status"] == "stopped"

@pytest.mark.asyncio
async def test_simulator_enforces_local_target_and_safety_limits():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        limits = await ac.get("/api/simulator/limits")
        assert limits.status_code == 200
        assert limits.json()["external_targets_allowed"] is False
        assert limits.json()["max_concurrency"] == 10
        assert limits.json()["max_requests_per_run"] == 1000

        rejected_target = await ac.post("/api/simulator/start", json={
            "target_service": "https://example.com",
        })
        assert rejected_target.status_code == 422

        rejected_concurrency = await ac.post("/api/simulator/start", json={
            "virtual_users": 11,
        })
        assert rejected_concurrency.status_code == 422

        rejected_request_cap = await ac.post("/api/simulator/start", json={
            "max_requests": 1001,
        })
        assert rejected_request_cap.status_code == 422

@pytest.mark.asyncio
async def test_simulator_generates_measured_local_requests_and_failure_recovers():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        start = await ac.post("/api/simulator/start", json={
            "pattern": "failure",
            "virtual_users": 1,
            "intensity": "low",
            "duration_seconds": 1,
            "max_requests": 1,
        })
        assert start.status_code == 200
        await simulator_engine._task

        status = (await ac.get("/api/simulator/status")).json()
        assert status["scenario_status"] == "request_limit_reached"
        assert status["requests_sent"] == 1
        assert status["errors_seen"] == 1
        assert status["live_timeline"][0]["rps"] is not None
        assert simulator_engine.test_service_failed is False

        target = await ac.get("/api/simulator/test-target")
        assert target.status_code == 200
        assert status["report_id"]
        report_response = await ac.get(f"/api/reports/{status['report_id']}")
        assert report_response.status_code == 200
        report = report_response.json()
        assert report["workload"]["requests_sent"] == 1
        assert report["risk_before"]["score"] is not None
        assert report["recovery"]["test_endpoint_available"] is True
        assert report["scaling_events"] == []

        csv_export = await ac.get(f"/api/reports/{status['report_id']}/csv")
        assert csv_export.status_code == 200
        assert "requests_sent" in csv_export.text

        pdf_export = await ac.get(f"/api/reports/{status['report_id']}/pdf")
        assert pdf_export.status_code == 200
        assert pdf_export.headers["content-type"].startswith("application/pdf")
        assert pdf_export.content.startswith(b"%PDF-1.4")

@pytest.mark.asyncio
async def test_risk_analysis_uses_measured_values_and_reports_missing_integrations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/risk")
        assert response.status_code == 200
        data = response.json()
        assert data["score"] is not None
        assert 0 <= data["score"] <= 100
        assert data["classification"] in {"low", "moderate", "high", "critical"}
        assert len(data["factors"]) == 10
        assert data["coverage"]["total_factors"] == 10
        factors = {factor["key"]: factor for factor in data["factors"]}
        assert factors["cpu_utilization"]["value"] is not None
        assert factors["cpu_utilization"]["normalized_score"] is not None
        assert factors["queue_depth"]["value"] is None
        assert factors["queue_depth"]["available"] is False
        assert data["risk_by_category"]["traffic_anomaly"] is None
        assert "not integrated" in factors["pod_health"]["evidence"]
        assert all(
            factor["threshold_status"] in {"warning", "critical"}
            for factor in data["threshold_violations"]
        )

@pytest.mark.asyncio
async def test_risk_configuration_validates_weights_and_thresholds():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        config = (await ac.get("/api/risk/config")).json()
        updated = await ac.put("/api/risk/config", json=config)
        assert updated.status_code == 200
        assert set(updated.json()["weights"]) == set(config["weights"])

        invalid = dict(config)
        invalid["classification_thresholds"] = {
            "moderate": 50,
            "high": 25,
            "critical": 75,
        }
        rejected = await ac.put("/api/risk/config", json=invalid)
        assert rejected.status_code == 422

@pytest.mark.asyncio
async def test_experiments_use_bounded_measured_runs_instead_of_seeded_comparisons():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        assert (await ac.get("/api/experiments")).json() == []

        rejected = await ac.post("/api/experiments/run", json={
            "name": "unbounded",
            "virtual_users": 11,
            "test_duration_seconds": 1,
        })
        assert rejected.status_code == 422

        result = await ac.post("/api/experiments/run", json={
            "name": "Measured local run",
            "pattern": "normal",
            "intensity": "low",
            "virtual_users": 1,
            "test_duration_seconds": 1,
            "max_requests": 1,
        })
        assert result.status_code == 200
        data = result.json()
        assert data["workload"]["requests_sent"] == 1
        assert data["metrics_after"]["p95_latency_ms"] is not None
        assert data["scaling_note"].startswith("No Kubernetes adapter")
        assert "does not compare" in data["description"]

@pytest.mark.asyncio
async def test_cache_benchmark():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test cached
        cached = await ac.get("/api/cache/test-cached")
        assert cached.status_code == 200
        assert cached.json()["cached"] is True
        assert cached.json()["latency_ms"] < 25.0

        # Benchmark
        bench = await ac.post("/api/cache/benchmark")
        assert bench.status_code == 200
        data = bench.json()
        assert "speedup_factor" in data["comparison"]
        assert "latency_reduction_percent" in data["comparison"]

@pytest.mark.asyncio
async def test_incidents_and_chaos():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        fail_res = await ac.post("/api/incidents/trigger-failure?service_id=order-service")
        assert fail_res.status_code == 501
        assert "bounded local test-target" in fail_res.json()["detail"]
        svc = await ac.get("/api/services/order-service")
        assert svc.json()["status"] == "unknown"
        rec_res = await ac.post("/api/incidents/recover")
        assert rec_res.status_code == 501
        assert (await ac.get("/api/incidents")).json() == []
