import { apiRequest } from "./client";
import type { AuthResult, PublicPlayer } from "@/types";

export const authApi = {
  signup(input: { displayName: string; email: string; password: string }) {
    return apiRequest<AuthResult>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  login(input: { email: string; password: string }) {
    return apiRequest<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  me() {
    return apiRequest<{ player: PublicPlayer }>("/auth/me", {
      auth: true
    });
  },

  updateDisplayName(displayName: string) {
    return apiRequest<{ player: PublicPlayer }>("/auth/me", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ displayName })
    });
  }
};
