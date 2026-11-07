import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.telemetry_state import telemetry_state
from app.services.autoscaler import autoscaler_service
from app.services.simulator_engine import simulator_engine
from app.models.entities import SimulatorConfig

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

@pytest.mark.asyncio
async def test_simulator_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Start simulator
        res = await ac.post("/api/simulator/start", json={
            "pattern": "spike",
            "virtual_users": 600,
            "duration_seconds": 45,
            "ramp_up_seconds": 10,
            "target_service": "all",
            "safe_simulation_mode": True
        })
        assert res.status_code == 200
        assert res.json()["is_running"] is True

        # Check status
        status = await ac.get("/api/simulator/status")
        assert status.json()["is_running"] is True

        # Stop simulator
        stop_res = await ac.post("/api/simulator/stop")
        assert stop_res.status_code == 200
        assert stop_res.json()["is_running"] is False

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
        # Inject failure
        fail_res = await ac.post("/api/incidents/trigger-failure?service_id=order-service")
        assert fail_res.status_code == 200
        assert fail_res.json()["status"] == "failure_injected"

        # Check service is degraded or critical
        svc = await ac.get("/api/services/order-service")
        assert svc.json()["status"] == "critical"

        # Recover
        rec_res = await ac.post("/api/incidents/recover")
        assert rec_res.status_code == 200
        assert rec_res.json()["status"] == "recovery_initiated"

        # Check service is back to healthy
        svc_after = await ac.get("/api/services/order-service")
        assert svc_after.json()["status"] == "healthy"
