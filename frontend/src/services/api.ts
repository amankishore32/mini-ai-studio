import axios from "axios";
import type { User } from "../types";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

export interface BackendGeneration {
  id: number;
  imageUrl: string | null;
  prompt: string;
  style: string | null;
  createdAt: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

export const API = {
  async signup(name: string, email: string, password: string): Promise<User> {
    const res = await api.post("/v1/auth/signup", { name, email, password });
    return {
      id: String(res.data.user.id),
      email: res.data.user.email,
      token: "", // signup does not return token in current backend; user logs in afterwards
    };
  },
  async login(email: string, password: string): Promise<User> {
    const res = await api.post("/v1/auth/login", { email, password });
    return {
      id: String(res.data.user.id),
      email: res.data.user.email,
      token: res.data.user.token,
    };
  },
  async createGeneration(
    token: string,
    payload: { prompt: string; style?: string; imageUpload?: string }
  ): Promise<BackendGeneration> {
    const res = await api.post(
      "/v1/generations",
      {
        prompt: payload.prompt,
        style: payload.style || "",
        imageUpload: payload.imageUpload || "", // backend requires imageUpload; empty string defaults to picsum
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },
  async listGenerations(
    token: string,
    limit = 5
  ): Promise<BackendGeneration[]> {
    const res = await api.get("/v1/generations", {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

export default API;
