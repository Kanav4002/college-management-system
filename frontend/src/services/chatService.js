import api from "../api/api";

export const listChats = (params = {}) => api.get("/chats", { params });
export const searchChatUsers = (params = {}) => api.get("/chats/users", { params });
export const searchMessages = (params = {}) => api.get("/chats/messages/search", { params });
export const getMessages = (chatId, params = {}) => api.get(`/chats/${chatId}/messages`, { params });
export const createPrivateChat = (userId) => api.post("/chats/private", { userId });
export const createGroupChat = (payload) => api.post("/chats/group", payload);
export const sendChatMessage = (chatId, payload) => api.post(`/chats/${chatId}/messages`, payload);
export const markChatRead = (chatId) => api.post(`/chats/${chatId}/read`);
export const editChatMessage = (messageId, text) => api.patch(`/chats/messages/${messageId}`, { text });
export const deleteChatMessage = (messageId) => api.delete(`/chats/messages/${messageId}`);
export const togglePinnedMessage = (messageId, pinned) => api.patch(`/chats/messages/${messageId}/pin`, { pinned });
export const listChatGroups = () => api.get("/groups");
