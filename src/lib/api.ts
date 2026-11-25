export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const init: RequestInit = { method, credentials: "same-origin", headers: { ...(headers || {}) } };
  if (body instanceof Blob || body instanceof ArrayBuffer) {
    init.body = body as BodyInit;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  const res = await fetch(path, init);
  const ctype = res.headers.get("content-type") || "";
  const data = ctype.includes("json") ? await res.json() : await res.text();
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/api/auth")) window.dispatchEvent(new Event("glf:unauthorized"));
    throw new ApiError(res.status, (data && (data as { error?: string }).error) || `Error ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T = any>(p: string) => request<T>("GET", p),
  post: <T = any>(p: string, b?: unknown, h?: Record<string, string>) => request<T>("POST", p, b ?? {}, h),
  patch: <T = any>(p: string, b: unknown) => request<T>("PATCH", p, b),
  put: <T = any>(p: string, b: unknown) => request<T>("PUT", p, b),
  del: <T = any>(p: string) => request<T>("DELETE", p),
};

export function qs(params: Record<string, string | number | undefined | null | boolean>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== false) u.set(k, String(v === true ? 1 : v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

export async function download(path: string, fallbackName = "export.xlsx") {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      msg = (await res.json()).error || msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  const name = m ? decodeURIComponent(m[1]) : fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return name;
}
