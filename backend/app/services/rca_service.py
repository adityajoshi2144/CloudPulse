from typing import Any, Dict, List


class IncidentService:
    """Incident history is empty until a real incident source is configured."""

    def get_incidents(self) -> List[Dict[str, Any]]:
        return []


incident_service = IncidentService()
