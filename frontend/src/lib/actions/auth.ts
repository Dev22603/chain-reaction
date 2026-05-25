"use server";

import { cookies } from "next/headers";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth";

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN_STORAGE_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_STORAGE_KEY);
}
