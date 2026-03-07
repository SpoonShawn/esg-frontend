// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Utility function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  console.log(API_BASE_URL + endpoint);
  return `${API_BASE_URL}${endpoint}`;
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