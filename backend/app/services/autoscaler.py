from typing import Any, Dict, List


class AutoScalerService:
    """Reports scaling events only; no orchestration adapter is configured."""

    def __init__(self) -> None:
        self.scaling_events: List[Dict[str, Any]] = []


autoscaler_service = AutoScalerService()
