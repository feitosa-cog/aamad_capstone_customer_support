import threading
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
import json
import os


class ServiceNowService:
    """Mocked ServiceNow client for MVP.

    Stores incidents in-memory and writes a log file `servicenow_mock.log`.
    This is a development-only mock; replace with a real HTTP client for production.
    """

    def __init__(self, base_url: Optional[str] = None, auth: Optional[tuple] = None, rate_limit_per_min: int = 600):
        self.base_url = base_url
        self.auth = auth
        self._lock = threading.Lock()
        self._incidents: Dict[str, Dict[str, Any]] = {}
        self._counter = 0
        self._rate_limit_per_min = rate_limit_per_min
        self._call_timestamps: List[float] = []
        self.log_path = os.path.join(os.getcwd(), 'servicenow_mock.log')

    def _rate_limited(self) -> bool:
        now = time.time()
        window_start = now - 60
        # drop old timestamps
        self._call_timestamps = [t for t in self._call_timestamps if t >= window_start]
        return len(self._call_timestamps) >= self._rate_limit_per_min

    def create_incident(self, short_description: str, description: str, urgency: int = 3, caller: Optional[str] = None) -> Dict[str, Any]:
        with self._lock:
            if self._rate_limited():
                raise RuntimeError('ServiceNow rate limit exceeded (mock)')
            self._call_timestamps.append(time.time())
            self._counter += 1
            seq = str(self._counter).zfill(4)
            incident_id = f"INC{datetime.utcnow().strftime('%Y%m%d')}{seq}"
            incident = {
                'incident_id': incident_id,
                'short_description': short_description,
                'description': description,
                'urgency': urgency,
                'caller': caller,
                'status': 'created',
                'created_at': datetime.utcnow().isoformat()
            }
            self._incidents[incident_id] = incident
            # append to log file for observability
            try:
                with open(self.log_path, 'a', encoding='utf-8') as fh:
                    fh.write(json.dumps(incident) + '\n')
            except Exception:
                # fail silently for logging
                pass
            return incident

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        return self._incidents.get(incident_id)

    def list_incidents(self) -> List[Dict[str, Any]]:
        return list(self._incidents.values())
