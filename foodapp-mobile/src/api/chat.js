import { api } from "./axios";

export async function initConversation() {
  try {
    const { data: me } = await api.get("api/users/me");
    
    // Try to get existing conversations first
    try {
      const { data: conversations } = await api.get("api/conversations");
      if (Array.isArray(conversations) && conversations.length > 0) {
        // Return the first conversation (user usually has one)
        return conversations[0];
      }
    } catch (getError) {
      console.log("No existing conversations, will create new one");
    }
    
    // If no conversation exists, try to create one
    const res = await api.post(`api/conversations?customerId=${me.id}`);
    return res.data;
  } catch (error) {
    console.error("Error init conversation:", error);
    throw error;
  }
}

export async function getMessages(convId) {
  try {
    const res = await api.get(`api/conversations/${convId}/messages`);
    return res.data;
  } catch (error) {
    console.error("Error get messages:", error);
    throw error;
  }
}

export async function getAllConversations() {
  try {
    const res = await api.get("api/conversations");
    return res.data;
  } catch (error) {
    console.error("Error get conversations:", error);
    throw error;
  }
}

export async function sendMessage(payload) {
  try {
    // Try POST to conversations/{id}/messages first (more RESTful)
    const convId = payload.conversationId;
    const messageData = {
      senderId: payload.senderId,
      content: payload.content
    };
    
    try {
      const res = await api.post(`api/conversations/${convId}/messages`, messageData);
      return res.data;
    } catch (e1) {
      // Fallback to /messages endpoint
      console.log("Trying fallback endpoint /messages");
      const res = await api.post("api/messages", payload);
      return res.data;
    }
  } catch (error) {
    console.error("Error send message:", error);
    throw error;
  }
}
