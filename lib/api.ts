export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE = "/orbit-api";

export async function api<T>(
  path: string,
  init: RequestInit & { skipAuthRedirect?: boolean } = {},
): Promise<T> {
  const { skipAuthRedirect, headers, ...rest } = init;
  const response = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  if (response.status === 401) {
    if (!skipAuthRedirect && typeof window !== "undefined") {
      const next = window.location.pathname;
      if (next !== "/login" && next !== "/register") {
        window.location.replace("/login");
      }
    }
    throw new ApiError(401, "Sign in to continue");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      detail?: string | Array<{ msg?: string }>;
    };
    const message =
      typeof payload.detail === "string"
        ? payload.detail
        : Array.isArray(payload.detail)
          ? (payload.detail[0]?.msg ?? "Request failed")
          : "Request failed";
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
