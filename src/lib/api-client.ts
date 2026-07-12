/**
 * A central fetch wrapper for communicating with our /api backend.
 * Handles 401s by redirecting to /login, and parses our standard ApiError responses.
 */

export class ApiClientError extends Error {
  constructor(public status: number, public message: string, public details?: any) {
    super(message);
    this.name = "ApiClientError";
  }
}

export const apiClient = {
  async fetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const defaultHeaders: Record<string, string> = {};
    if (!(options.body instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (res.status === 401) {
      if (
        typeof window !== "undefined" && 
        !window.location.pathname.startsWith("/login") && 
        !window.location.pathname.startsWith("/signup")
      ) {
        window.location.href = "/login";
      }
      throw new ApiClientError(401, "Unauthorized");
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok || (data && data.success === false)) {
      throw new ApiClientError(
        res.status,
        data.error || "An unexpected error occurred",
        data.details
      );
    }

    return data.data !== undefined ? data.data : data;
  },

  get<T = any>(endpoint: string, options?: RequestInit) {
    return this.fetch<T>(endpoint, { ...options, method: "GET" });
  },

  post<T = any>(endpoint: string, body: any, options?: RequestInit) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put<T = any>(endpoint: string, body: any, options?: RequestInit) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch<T = any>(endpoint: string, body: any, options?: RequestInit) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.fetch<T>(endpoint, { ...options, method: "DELETE" });
  },
};
