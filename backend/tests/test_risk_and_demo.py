import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.risk_engine import risk_engine
from app.services.demo_engine import demo_engine
from app.services.shield_service import shield_service
from app.services.autoscaler import autoscaler_service
from app.services.rca_service import incident_service
from app.core.metrics_collector import metrics_collector
from app.core.telemetry_state import telemetry_state


@pytest.mark.asyncio
async def test_security_verdict_endpoint_and_structure():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/risk/verdict")
        assert res.status_code == 200
        data = res.json()
        assert "risk_level" in data
        assert data["risk_level"] in {"LOW RISK", "MEDIUM RISK", "HIGH RISK", "CRITICAL RISK", "INSUFFICIENT DATA"}
        assert "risk_score" in data
        assert "traffic_classification" in data
        assert data["traffic_classification"] in {
            "NORMAL TRAFFIC",
            "LEGITIMATE TRAFFIC SURGE",
            "SUSPICIOUS TRAFFIC",
            "SIMULATED ATTACK TRAFFIC",
            "UNKNOWN / INSUFFICIENT EVIDENCE",
        }
        assert "website_health" in data
        assert "security_status" in data
        assert "detected_indicators" in data
        assert isinstance(data["detected_indicators"], list)
        assert "explanation" in data
        assert "recommended_action" in data
        assert "mitigation_status" in data
        assert "assessed_at" in data


@pytest.mark.asyncio
async def test_legitimate_surge_vs_attack_classification():
    # 1. Normal traffic test
    normal_verdict = risk_engine._classify_traffic(
        is_simulation=False,
        sim_pattern="idle",
        current_rps=3.0,
        baseline_rps=2.5,
        error_rate=0.0,
        total_requests=100,
    )
    assert normal_verdict[0] == "NORMAL TRAFFIC"
    assert normal_verdict[2] is False  # not attack

    # 2. Legitimate traffic surge (high RPS, but low errors and not attack pattern)
    surge_verdict = risk_engine._classify_traffic(
        is_simulation=False,
        sim_pattern="idle",
        current_rps=18.0,
        baseline_rps=3.0,
        error_rate=0.0,
        total_requests=300,
    )
    assert surge_verdict[0] == "LEGITIMATE TRAFFIC SURGE"
    assert surge_verdict[2] is False  # not an attack

    # 3. Suspicious traffic (high RPS + high errors)
    suspicious_verdict = risk_engine._classify_traffic(
        is_simulation=False,
        sim_pattern="idle",
        current_rps=22.0,
        baseline_rps=3.0,
        error_rate=8.5,
        total_requests=400,
    )
    assert suspicious_verdict[0] == "SUSPICIOUS TRAFFIC"
    assert suspicious_verdict[2] is True

    # 4. Simulated Attack Traffic (burst/flood simulation)
    sim_verdict = risk_engine._classify_traffic(
        is_simulation=True,
        sim_pattern="burst",
        current_rps=20.0,
        baseline_rps=3.0,
        error_rate=0.0,
        total_requests=200,
    )
    assert sim_verdict[0] == "SIMULATED ATTACK TRAFFIC"
    assert sim_verdict[2] is True


@pytest.mark.asyncio
async def test_shield_rate_limiting_enforcement():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Check shield status endpoint
        shield_res = await ac.get("/api/shield/status")
        assert shield_res.status_code == 200
        assert shield_res.json()["rate_limiting_enforced"] is True
        assert shield_res.json()["rate_limit_rps"] == 20

        # Reset shield for test
        shield_service.reset_stats()
        shield_service.rate_limit_rps = 5  # low cap for testing

        # First 5 requests should pass
        for _ in range(5):
            res = await ac.get("/api/simulator/test-target")
            assert res.status_code == 200

        # 6th request in same second should be throttled with HTTP 429
        throttled_res = await ac.get("/api/simulator/test-target")
        assert throttled_res.status_code == 429
        assert "Rate limit exceeded" in throttled_res.json()["detail"]

        # Restore cap
        shield_service.rate_limit_rps = 20
        shield_service.reset_stats()


@pytest.mark.asyncio
async def test_faculty_demo_endpoints_and_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Initial status
        status_res = await ac.get("/api/demo/status")
        assert status_res.status_code == 200
        assert status_res.json()["total_stages"] == 7

        # Start demo
        start_res = await ac.post("/api/demo/start")
        assert start_res.status_code == 200
        assert start_res.json()["is_running"] is True
        assert start_res.json()["current_stage"] == 1

        # Duplicate start should be rejected with 409
        dup_res = await ac.post("/api/demo/start")
        assert dup_res.status_code == 409

        # Pause demo
        pause_res = await ac.post("/api/demo/pause")
        assert pause_res.status_code == 200
        assert pause_res.json()["is_paused"] is True

        # Resume demo
        resume_res = await ac.post("/api/demo/resume")
        assert resume_res.status_code == 200
        assert resume_res.json()["is_paused"] is False

        # Stop demo
        stop_res = await ac.post("/api/demo/stop")
        assert stop_res.status_code == 200
        assert stop_res.json()["is_running"] is False

        # Reset demo
        reset_res = await ac.post("/api/demo/reset")
        assert reset_res.status_code == 200
        assert reset_res.json()["current_stage"] == 1
        assert reset_res.json()["is_running"] is False


@pytest.mark.asyncio
async def test_autoscaling_and_incident_rca_integration():
    # Test scaling event recording
    event = autoscaler_service.trigger_scaling(
        service_id="order-service",
        to_replicas=4,
        trigger_metric="Host CPU / Ingress RPS",
        metric_value=84.0,
        reason="Traffic surge mitigation",
        is_real_k8s=False,
    )
    assert event["to_replicas"] == 4
    assert event["is_real_k8s"] is False
    assert len(autoscaler_service.get_scaling_events()) >= 1

    # Test incident creation and RCA retrieval
    incident = incident_service.create_incident(
        incident_id="INC-TEST-001",
        title="Test Ingress Anomaly",
        severity="P1-Critical",
        status="active",
        probable_cause="Simulated burst flood",
    )
    assert incident["id"] == "INC-TEST-001"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        rca_res = await ac.get("/api/incidents/INC-TEST-001/rca")
        assert rca_res.status_code == 200
        rca = rca_res.json()
        assert rca["incident_id"] == "INC-TEST-001"
        assert len(rca["evidence"]) >= 1
        assert len(rca["corrective_actions_taken"]) >= 1

    # Reset
    autoscaler_service.reset()
    incident_service.clear()
