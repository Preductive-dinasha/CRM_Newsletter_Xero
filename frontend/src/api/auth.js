import client from "./client";

export const login = (email, password) =>
  client.post("/auth/login", { email, password });

export const logout = () => client.post("/auth/logout");

export const getMe = () => client.get("/users/me");

export const register = ({ email, password, f_name, l_name, company }) =>
  client.post("/auth/register", { email, password, f_name, l_name, company: company || undefined });
