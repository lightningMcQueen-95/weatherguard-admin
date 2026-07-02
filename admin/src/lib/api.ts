import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "github";
  role: "user" | "admin";
  status: "pending" | "approved" | "rejected";
  telegramChatId?: string;
  location?: { name: string; lat: number; lon: number };
  createdAt: string;
}
