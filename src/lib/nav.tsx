import { createContext, useContext } from "react";

export type Route = { page: string; params: URLSearchParams };

export function navigate(page: string, params?: Record<string, string>) {
  const q = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString() : "";
  window.location.hash = `/${page}${q ? "?" + q : ""}`;
}

export const CompanyCtx = createContext<(id: number) => void>(() => {});
export const useOpenCompany = () => useContext(CompanyCtx);
export const RefreshCtx = createContext<{ tick: number; bump: () => void }>({ tick: 0, bump: () => {} });
export const useRefresh = () => useContext(RefreshCtx);
