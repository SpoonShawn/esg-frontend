import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname.includes('vercel.app') ? 'https://esg-backend-one.vercel.app' : 'http://localhost:8000');

// Types
export interface Company {
  id: number;
  company_name: string;
  location: string;
  access_code: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  company_name: string;
  location: string;
}

export interface CompanyUpdate {
  company_name?: string;
  location?: string;
}

export interface Activity {
  id: number;
  company_id: number;
  activity_name: string;
  category: string;
  subcategory?: string;
  description?: string;
  emissions: number;
  date: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityCreate {
  company_id: number;
  activity_name: string;
  category: string;
  description?: string;
  emissions: number;
  date: string;
  location?: string;
}

export interface ActivityUpdate {
  activity_name?: string;
  category?: string;
  description?: string;
  emissions?: number;
  date?: string;
}

export interface ActivityCreateResponse {
  prepared_activity: any;
  followup_questions: any;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// API Response wrapper
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Generic API hook
export function useApi<T>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const executeRequest = useCallback(async <R = T>(
    url: string,
    options: RequestInit = {}
  ): Promise<R | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content responses (like DELETE requests)
      if (response.status === 204) {
        setState(prev => ({ ...prev, error: null, loading: false }));
        return null; // Return null for 204 responses, but the request was successful
      }

      // Only try to parse JSON for responses that have content
      const data = await response.json();
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  }, []);

  return {
    ...state,
    executeRequest,
  };
}

// Company API hooks
export function useCompanies() {
  const { data: companies, error, loading, executeRequest } = useApi<Company[]>();

  const fetchCompanies = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    location?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.location) searchParams.append('location', params.location);

    const url = `/api/companies/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return executeRequest(url);
  }, [executeRequest]);

  const createCompany = useCallback(async (companyData: CompanyCreate) => {
    const result = await executeRequest('/api/companies/', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
    
    if (result) {
      toast.success('Company created successfully');
      // Refresh the companies list
      fetchCompanies();
    }
    
    return result;
  }, [executeRequest, fetchCompanies]);

  const updateCompany = useCallback(async (companyId: number, companyData: CompanyUpdate) => {
    const result = await executeRequest(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
    
    if (result) {
      toast.success('Company updated successfully');
      // Refresh the companies list
      fetchCompanies();
    }
    
    return result;
  }, [executeRequest, fetchCompanies]);

  const deleteCompany = useCallback(async (companyId: number) => {
    try {
      const result = await executeRequest(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });
      
      // If we reach here, the request was successful (either with data or 204)
      toast.success('Company deleted successfully');
      // Refresh the companies list
      fetchCompanies();
      
      return result;
    } catch (error) {
      // Error is already handled by executeRequest and shown in toast
      return null;
    }
  }, [executeRequest, fetchCompanies]);



  const getCompanyByAccessCode = useCallback(async (accessCode: string) => {
    return executeRequest(`/api/companies/access-code/${accessCode}`);
  }, [executeRequest]);

  return {
    companies,
    error,
    loading,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyByAccessCode,
  };
}

// Activity API hooks
export function useActivities() {
  const { data: activities, error, loading: fetchLoading, executeRequest } = useApi<Activity[]>();
  const [createLoading, setCreateLoading] = useState(false);

  const fetchActivities = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    company_id?: number;
    category?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.company_id) searchParams.append('company_id', params.company_id.toString());
    if (params?.category) searchParams.append('category', params.category);

    const url = `/api/activities/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return executeRequest(url);
  }, [executeRequest]);

  const createActivity = useCallback(async (activityData: ActivityCreate): Promise<ActivityCreateResponse | null> => {
    setCreateLoading(true);
    try {
      // Use a separate fetch call that doesn't affect the activities state
      const response = await fetch(`${API_BASE_URL}/api/activities/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      return null;
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const updateActivity = useCallback(async (activityId: number, activityData: ActivityUpdate) => {
    const result = await executeRequest(`/api/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    });
    
    if (result) {
      toast.success('Activity updated successfully');
      // Refresh the activities list
      fetchActivities();
    }
    
    return result;
  }, [executeRequest, fetchActivities]);

  const deleteActivity = useCallback(async (activityId: number) => {
    try {
      const result = await executeRequest(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });
      
      // If we reach here, the request was successful (either with data or 204)
      toast.success('Activity deleted successfully');
      // Refresh the activities list
      fetchActivities();
      
      return result;
    } catch (error) {
      // Error is already handled by executeRequest and shown in toast
      return null;
    }
  }, [executeRequest, fetchActivities]);

  const answersActivity = useCallback(async (activityId: number, location: string, followupAnswers: Record<string, any>) => {
    try {
      console.log(followupAnswers)
      const result = await executeRequest(`/api/activities/${activityId}/followup-answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followup_answers: followupAnswers, location }),
      });

      if (result) {
        toast.success("Activity updated successfully");
        fetchActivities();
      }

      return result;
    } catch (error) {
    }
  },[executeRequest, fetchActivities]);

  const createCompleteActivity = useCallback(async (payload: {
    prepared_activity: any;
    location: string;
    followup_answers: Record<string, any>;
  }): Promise<Activity | null> => {
    setCreateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      return null;
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const sendQuestions = useCallback(
  async (category: string, location: string): Promise<Record<string, any> | null> => {
    try {
      const result = await executeRequest(`/api/activities/send_questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, location }),
      });

      if (!result) {
        toast.error("Failed to fetch questions");
        return null;
      }

      return result; 
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Error fetching questions");
      return null;
    }
  },
    []
  );

  return {
    activities,
    error,
    loading: fetchLoading,
    createLoading,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    answersActivity,
    createCompleteActivity,
    sendQuestions
  };
}

// Category API hooks
export function useCategories() {
  const { data: categories, error, loading, executeRequest } = useApi<Category[]>();

  const fetchCategories = useCallback(async () => {
    return executeRequest('/api/categories/');
  }, [executeRequest]);

  return {
    categories,
    error,
    loading,
    fetchCategories,
  };
}

// Business Categories API hook
export function useBusinessCategories() {
  const { data: businessCategories, error, loading, executeRequest } = useApi<Record<string, Record<string, string[]>>>();

  const fetchBusinessCategories = useCallback(async () => {
    return executeRequest('/api/activities/categories/list');
  }, [executeRequest]);

  return {
    businessCategories,
    error,
    loading,
    fetchBusinessCategories,
  };
}

// Auth hook
export function useAuth() {
  const { error, loading, executeRequest } = useApi<Company>();

  const login = useCallback(async (accessCode: string) => {
    const result = await executeRequest(`/api/companies/access-code/${accessCode}`);
    
    if (result) {
      // Store company info in localStorage
      localStorage.setItem('esg_access_token', accessCode);
      localStorage.setItem('company_name', result.company_name);
      localStorage.setItem('company_id', result.id.toString());
      localStorage.setItem('location', result.location);
      toast.success('Login successful');
    }
    
    return result;
  }, [executeRequest]);

  const logout = useCallback(() => {
    localStorage.removeItem('esg_access_token');
    localStorage.removeItem('company_name');
    localStorage.removeItem('company_id');
    localStorage.removeItem('location');
    toast.success('Logged out successfully');
  }, []);

  const getCurrentCompany = useCallback(() => {
    const accessCode = localStorage.getItem('esg_access_token');
    const companyName = localStorage.getItem('company_name');
    const companyId = localStorage.getItem('company_id');
    const companyCountry = localStorage.getItem('location');
    
    if (!accessCode || !companyName || !companyId || !companyCountry) {
      return null;
    }
    
    return {
      id: parseInt(companyId),
      company_name: companyName,
      access_code: accessCode,
      location: companyCountry,
    };
  }, []);

  return {
    error,
    loading,
    login,
    logout,
    getCurrentCompany,
  };
} 