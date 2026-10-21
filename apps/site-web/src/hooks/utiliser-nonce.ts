import { createContext, use } from "react";

export const ContexteNonce = createContext<string | undefined>(undefined);

export function utiliserNonce(): string | undefined {
  const nonce = use(ContexteNonce);
  if (nonce !== undefined || typeof document === "undefined") return nonce;
  return document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce || undefined;
}
