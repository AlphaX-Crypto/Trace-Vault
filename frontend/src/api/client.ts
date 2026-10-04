/**
 * TRACEVAULT API Client Layer
 * Centralized, typed HTTP client communicating with Node.js/Express API gateway.
 * Manages JWT bearer tokens, structured error normalization, and request timeouts.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type DataSourceState = 'LIVE_BACKEND' | 'DEMO_SYNTHETIC' | 'BACKEND_UNAVAILABLE';

class ApiClient {
  private baseUrl: string;
  private tokenKey = 'tracevault_auth_token';

  constructor() {
    const metaEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;
    this.baseUrl = (metaEnv || 'http://localhost:5000').replace(/\/+$/, '');
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  public setToken(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch {
      // Ignore if localStorage unavailable
    }
  }

  public clearToken(): void {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch {
      // Ignore
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const json: ApiResponse<T> = await response.json();
      return json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError';
      return {
        success: false,
        error: {
          code: isTimeout ? 'GATEWAY_TIMEOUT' : 'BACKEND_UNAVAILABLE',
          message: isTimeout
            ? 'The request to TRACEVAULT backend gateway timed out.'
            : 'Could not connect to TRACEVAULT backend gateway. The service may be offline.',
          details: err?.message
        }
      };
    }
  }

  public async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlWithSlash(endpoint), {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  public async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlWithSlash(endpoint), {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(urlWithSlash(endpoint), { method: 'DELETE' });
  }

  /**
   * Quick liveness probe checking backend availability
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const res = await this.get<{ status: string }>('/health');
      return res.success && res.data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

function urlWithSlash(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

export const api = new ApiClient();
