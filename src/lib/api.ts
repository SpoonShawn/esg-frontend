// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Utility function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Fetch with timeout wrapper
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Dashboard
  dashboard: (companyId: number) => `/api/dashboard/${companyId}`,

  // Analysis
  analysis: (companyId: number) => `/api/analysis/${companyId}`,

  // Chat
  chat: (companyId: number) => `/api/chat/${companyId}`,

  // Companies
  companies: '/api/companies/',
  companyByAccessCode: (accessCode: string) => `/api/companies/access-code/${accessCode}`,

  // Activities
  activities: '/api/activities/',
} as const; 