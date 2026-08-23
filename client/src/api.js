const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('sih_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type header if sending FormData (file uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An unexpected server error occurred');
  }

  return data;
}
