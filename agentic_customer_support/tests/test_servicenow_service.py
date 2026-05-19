import pytest
from agentic_customer_support.services.servicenow_service import ServiceNowService


def test_incident_creation_and_list():
    sn = ServiceNowService(rate_limit_per_min=10)
    inc = sn.create_incident("short", "desc", 3, caller="caller1")
    assert "incident_id" in inc
    got = sn.get_incident(inc["incident_id"])
    assert got["short_description"] == "short"
    list_all = sn.list_incidents()
    assert any(i["incident_id"] == inc["incident_id"] for i in list_all)


def test_rate_limit():
    sn = ServiceNowService(rate_limit_per_min=1)
    sn.create_incident("a", "b")
    with pytest.raises(RuntimeError):
        sn.create_incident("x", "y")
