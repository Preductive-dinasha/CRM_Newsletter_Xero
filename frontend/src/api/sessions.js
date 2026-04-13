import client from "./client";

export const getSessions = () => client.get("/sessions");

export const createSession = (title) =>
  client.post("/sessions", { title: title || "New Chat" });

export const deleteSession = (sessionId) =>
  client.delete(`/sessions/${sessionId}`);

export const updateSessionTitle = (sessionId, title) =>
  client.patch(`/sessions/${sessionId}`, { title });

export const getHistory = (sessionId) =>
  client.get(`/chat/${sessionId}/history`);

export const getSkills = () => client.get("/skills");
