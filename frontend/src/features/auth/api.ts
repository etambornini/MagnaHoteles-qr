import { apiFetch } from "@/lib/http";

export type UserRole = "ADMIN" | "MANAGER";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  hotel?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export const login = async (credentials: { email: string; password: string }) =>
  apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
