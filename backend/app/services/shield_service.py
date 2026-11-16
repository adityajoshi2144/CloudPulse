from __future__ import annotations

import time
from collections import deque
from datetime import datetime, timezone
from typing import Any


class ShieldService:
    """
    CloudPulse Shield: Local rate-limiting and request protection enforcement layer.
    
    Provides honest, in-process rate-limiting and traffic filtering for local endpoints.
    Enforces concurrency and throughput caps to protect downstream services.
    """

    def __init__(self, rate_limit_rps: int = 20, max_burst: int = 10) -> None:
        self.enabled: bool = True
        self.rate_limit_rps: int = rate_limit_rps
        self.max_burst: int = max_burst
        self._request_timestamps: deque[float] = deque(maxlen=2000)
        self.total_evaluated: int = 0
        self.total_allowed: int = 0
        self.total_blocked: int = 0
        self.last_blocked_at: str | None = None
        self.last_action_time: str = datetime.now(timezone.utc).isoformat()
        self.mitigation_enforced: bool = True
        self.mitigation_actions: list[dict[str, Any]] = [
            {
                "action": "Rate Limiting Filter",
                "enforcement_type": "REAL ACTION",
                "status": "Active",
                "policy": f"Max {rate_limit_rps} req/s on ingress gateway",
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                "requests_affected": 0,
            }
        ]

    def check_request(self, client_ip: str = "127.0.0.1", path: str = "") -> tuple[bool, str]:
        """
        Evaluate an incoming request against active rate-limiting policy.
        Returns (is_allowed, reason).
        """
        now = time.time()
        self.total_evaluated += 1

        if not self.enabled or not self.mitigation_enforced:
            self.total_allowed += 1
            return True, "Shield disabled"

        # Count requests in the rolling 1.0 second window
        while self._request_timestamps and self._request_timestamps[0] < now - 1.0:
            self._request_timestamps.popleft()

        current_window_count = len(self._request_timestamps)

        if current_window_count >= self.rate_limit_rps:
            self.total_blocked += 1
            self.last_blocked_at = datetime.now(timezone.utc).isoformat()
            self.last_action_time = self.last_blocked_at
            
            # Update action log
            if self.mitigation_actions:
                self.mitigation_actions[0]["requests_affected"] = self.total_blocked

            return False, f"Rate limit exceeded ({self.rate_limit_rps} req/s cap). Request throttled by CloudPulse Shield."

        self._request_timestamps.append(now)
        self.total_allowed += 1
        return True, "Request permitted"

    def record_mitigation_event(
        self,
        action: str,
        enforcement_type: str,
        details: str,
        requests_affected: int = 0,
    ) -> dict[str, Any]:
        """Record an explicit defense/mitigation event."""
        event = {
            "action": action,
            "enforcement_type": enforcement_type,  # REAL ACTION, SIMULATED ACTION, RECOMMENDED ACTION
            "details": details,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "requests_affected": requests_affected,
        }
        self.mitigation_actions.insert(0, event)
        if len(self.mitigation_actions) > 20:
            self.mitigation_actions.pop()
        self.last_action_time = datetime.now(timezone.utc).isoformat()
        return event

    def get_status(self) -> dict[str, Any]:
        now = time.time()
        active_in_window = sum(1 for t in self._request_timestamps if t >= now - 1.0)
        return {
            "shield_enabled": self.enabled,
            "rate_limiting_enforced": self.mitigation_enforced,
            "rate_limit_rps": self.rate_limit_rps,
            "current_window_rps": active_in_window,
            "total_evaluated": self.total_evaluated,
            "total_allowed": self.total_allowed,
            "total_blocked": self.total_blocked,
            "last_blocked_at": self.last_blocked_at,
            "last_action_time": self.last_action_time,
            "enforcement_mode": "real_enforcement_local",
            "enforcement_scope": "In-process ASGI ingress gateway and test endpoints",
            "recent_actions": list(self.mitigation_actions[:5]),
        }

    def reset_stats(self) -> None:
        self.total_evaluated = 0
        self.total_allowed = 0
        self.total_blocked = 0
        self.last_blocked_at = None
        self._request_timestamps.clear()
        self.mitigation_actions = [
            {
                "action": "Rate Limiting Filter",
                "enforcement_type": "REAL ACTION",
                "status": "Active",
                "policy": f"Max {self.rate_limit_rps} req/s on ingress gateway",
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                "requests_affected": 0,
            }
        ]


shield_service = ShieldService()
