import { API_BASE_URL } from '../config'

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/api') 
    ? API_BASE_URL.slice(0, -4) 
    : API_BASE_URL;
  return `${baseUrl}/api/${endpoint.replace(/^\/+/, '')}`;
};
