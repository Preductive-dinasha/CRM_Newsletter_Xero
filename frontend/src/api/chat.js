import client from "./client";

export const sendMessage = (sessionId, message, skill, file) => {
  const form = new FormData();
  form.append("message", message);
  if (skill) form.append("skill", skill);
  if (file) form.append("file", file);
  return client.post(`/chat/${sessionId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
