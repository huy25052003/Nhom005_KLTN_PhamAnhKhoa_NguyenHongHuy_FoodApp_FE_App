import { api } from "./axios";

export async function initConversation() {
  try {
    const { data: me } = await api.get("users/me");
    const res = await api.post(`/conversations?customerId=${me.id}`);
    return res.data;
  } catch (error) {
    console.error("Error init conversation:", error);
    throw error;
  }
}

export async function getMessages(convId) {
  try {
    const res = await api.get(`/conversations/${convId}/messages`);
    return res.data;
  } catch (error) {
    console.error("Error get messages:", error);
    throw error;
  }
}

export async function getAllConversations() {
  try {
    const res = await api.get("/conversations");
    return res.data;
  } catch (error) {
    console.error("Error get conversations:", error);
    throw error;
  }
}

export async function sendMessage(payload) {
  try {
    const res = await api.post("/messages", payload); 
    return res.data;
  } catch (error) {
    console.error("Error send message:", error);
    throw error;
  }
}
