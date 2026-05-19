from agentic_customer_support.services.conversation_service import ConversationService


def test_conversation_create_and_message():
    cs = ConversationService()
    conv = cs.create_conversation("user1", "title")
    assert conv["user_id"] == "user1"
    cid = conv["id"]
    msg = cs.add_message(cid, "user", "user1", "hello")
    assert msg["conversation_id"] == cid
    conv_full = cs.get_conversation(cid)
    assert conv_full["id"] == cid
    assert len(conv_full["messages"]) >= 1
