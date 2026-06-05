import { SIGN_OUT_CONFIRM } from "@/lib/constants";

export function confirmSignOut(): boolean {
  return typeof window !== "undefined" && window.confirm(SIGN_OUT_CONFIRM);
}
