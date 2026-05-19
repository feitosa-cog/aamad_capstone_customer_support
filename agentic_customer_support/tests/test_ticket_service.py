from agentic_customer_support.services.ticket_service import TicketService


def test_ticket_crud():
    ts = TicketService()
    t = ts.create_ticket("conv1", "user1", {"foo": "bar"})
    assert t["conversation_id"] == "conv1"
    tid = t["id"]
    got = ts.get_ticket(tid)
    assert got is not None
    assert got["id"] == tid
    lst = ts.list_tickets(user_id="user1")
    assert any(x["id"] == tid for x in lst)
    upd = ts.update_ticket(tid, {"status": "resolved"})
    assert upd["status"] == "resolved"
