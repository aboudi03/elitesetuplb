import config from './config';

function getRuntimeApiBaseUrl() {
  if (typeof window === "undefined") {
    return config.apiBaseUrl;
  }

  try {
    const apiUrl = new URL(config.apiBaseUrl);

    if (["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname)) {
      apiUrl.hostname = window.location.hostname;
    }

    return apiUrl.toString().replace(/\/+$/, "");
  } catch {
    return config.apiBaseUrl;
  }
}

export const apiClient = {
  baseUrl: config.apiBaseUrl,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${getRuntimeApiBaseUrl()}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    return fetch(url, { ...defaultOptions, ...options });
  },
  
  // Convenience methods
  get: (endpoint: string, options?: RequestInit) => 
    apiClient.request(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data?: any, options?: RequestInit) =>
    apiClient.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (endpoint: string, data?: any, options?: RequestInit) =>
    apiClient.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (endpoint: string, options?: RequestInit) =>
    apiClient.request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
