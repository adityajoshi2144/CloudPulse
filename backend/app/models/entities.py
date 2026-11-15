from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from pydantic import BaseModel, Field, model_validator
from app.core.database import Base

# ==========================================
# SQLALCHEMY ORM MODELS
# ==========================================

class ServiceEntity(Base):
    __tablename__ = "services"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tier = Column(String, default="backend") # gateway, core, data, cache
    status = Column(String, default="healthy") # healthy, degraded, critical
    replicas = Column(Integer, default=2)
    min_replicas = Column(Integer, default=1)
    max_replicas = Column(Integer, default=10)
    target_cpu = Column(Integer, default=70)
    cpu_percent = Column(Float, default=32.4)
    memory_percent = Column(Float, default=45.1)
    rps = Column(Float, default=45.0)
    latency_p95 = Column(Float, default=35.0)
    error_rate = Column(Float, default=0.02)
    restart_count = Column(Integer, default=0)
    dependencies = Column(JSON, default=list)
    version = Column(String, default="v2.4.1")
    updated_at = Column(DateTime, default=datetime.utcnow)

class ScalingEventEntity(Base):
    __tablename__ = "scaling_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    service_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    from_replicas = Column(Integer)
    to_replicas = Column(Integer)
    trigger_metric = Column(String) # CPU, Memory, RPS, Latency
    metric_value = Column(Float)
    reason = Column(Text)
    is_real_k8s = Column(Boolean, default=False)

class IncidentEntity(Base):
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True, index=True) # e.g. INC-2026-042
    title = Column(String, nullable=False)
    severity = Column(String, default="P2") # P1-Critical, P2-High, P3-Moderate
    status = Column(String, default="active") # active, investigating, mitigating, resolved
    affected_services = Column(JSON, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    probable_cause = Column(Text, nullable=True)
    impact_summary = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

class AlertEntity(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, index=True)
    service_id = Column(String)
    title = Column(String)
    metric = Column(String)
    threshold = Column(Float)
    current_value = Column(Float)
    severity = Column(String, default="warning") # warning, critical
    status = Column(String, default="firing") # firing, acknowledged, resolved
    triggered_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

class ExperimentEntity(Base):
    __tablename__ = "experiments"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    baseline_metrics = Column(JSON)
    optimized_metrics = Column(JSON)
    status = Column(String, default="completed") # running, completed
    report_markdown = Column(Text)

class AuditLogEntity(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    operator = Column(String, default="operator@cloudpulse.internal")
    action = Column(String) # e.g., "UPDATE_POLICY", "SIMULATION_START", "POD_RESTART"
    resource_type = Column(String)
    resource_id = Column(String)
    details = Column(JSON, default=dict)

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class ServiceDTO(BaseModel):
    id: str
    name: str
    tier: str
    status: str
    replicas: int
    min_replicas: int
    max_replicas: int
    target_cpu: int
    cpu_percent: float
    memory_percent: float
    rps: float
    latency_p95: float
    error_rate: float
    restart_count: int
    dependencies: List[str] = []
    version: str
    updated_at: Optional[datetime] = None

class ScalingPolicyUpdate(BaseModel):
    target_cpu: int = Field(..., ge=10, le=95)
    min_replicas: int = Field(..., ge=1, le=20)
    max_replicas: int = Field(..., ge=1, le=50)
    scale_up_cooldown: int = Field(15, ge=0)
    scale_down_cooldown: int = Field(30, ge=0)

    @model_validator(mode="after")
    def validate_replica_bounds(self):
        if self.min_replicas > self.max_replicas:
            raise ValueError("min_replicas cannot exceed max_replicas.")
        return self

class ScalingEventDTO(BaseModel):
    id: int
    service_id: str
    timestamp: datetime
    from_replicas: int
    to_replicas: int
    trigger_metric: str
    metric_value: float
    reason: str
    is_real_k8s: bool

class SimulatorConfig(BaseModel):
    pattern: Literal["normal", "spike", "flood", "burst", "resource", "failure", "gradual"] = "spike"
    virtual_users: int = Field(4, ge=1, le=10)
    intensity: Literal["low", "medium", "high"] = "medium"
    duration_seconds: int = Field(15, ge=1, le=60)
    ramp_up_seconds: int = Field(5, ge=0, le=60)
    max_requests: int = Field(200, ge=1, le=1000)
    target_service: Literal["cloudpulse-test-service"] = "cloudpulse-test-service"
    safe_simulation_mode: Literal[True] = True

class IncidentActionRequest(BaseModel):
    action: str # "restart_pod", "drain_traffic", "revert_deployment", "resolve"
    service_id: Optional[str] = None
    notes: Optional[str] = None

class AlertThresholdConfig(BaseModel):
    metric: str
    warning_threshold: float
    critical_threshold: float
    enabled: bool = True

class ExperimentRunRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    test_duration_seconds: int = Field(15, ge=1, le=60)
    virtual_users: int = Field(2, ge=1, le=10)
    pattern: Literal["normal", "spike", "flood", "burst", "resource", "failure", "gradual"] = "spike"
    intensity: Literal["low", "medium", "high"] = "low"
    max_requests: int = Field(200, ge=1, le=1000)
