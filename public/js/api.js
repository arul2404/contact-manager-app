/**
 * Contact Manager - API Client & Session Manager
 */
const API = (() => {
  const BASE_URL = '/api';
  const TOKEN_KEY = 'contact_manager_auth_token';
  const USER_KEY = 'contact_manager_user_data';

  // Get current stored JWT token
  const getToken = () => localStorage.getItem(TOKEN_KEY);

  // Set auth session data
  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  };

  // Clear auth session
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // Get cached user info
  const getCurrentUser = () => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Generic fetch wrapper with automatic JWT headers
  const request = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If unauthorized or token expired, trigger session clear event
        if (response.status === 401 && token) {
          clearSession();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  return {
    getToken,
    setSession,
    clearSession,
    getCurrentUser,

    // Auth endpoints
    auth: {
      register: (name, email, password) =>
        request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        }),

      login: (email, password) =>
        request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),

      getMe: () => request('/auth/me', { method: 'GET' }),
    },

    // Contacts endpoints
    contacts: {
      getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.q) query.append('q', params.q);
        if (params.category && params.category !== 'All') query.append('category', params.category);
        if (params.favorite === true || params.favorite === 'true') query.append('favorite', 'true');
        if (params.sort) query.append('sort', params.sort);

        const queryString = query.toString() ? `?${query.toString()}` : '';
        return request(`/contacts${queryString}`, { method: 'GET' });
      },

      getById: (id) => request(`/contacts/${id}`, { method: 'GET' }),

      create: (contactData) =>
        request('/contacts', {
          method: 'POST',
          body: JSON.stringify(contactData),
        }),

      update: (id, contactData) =>
        request(`/contacts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(contactData),
        }),

      delete: (id) =>
        request(`/contacts/${id}`, {
          method: 'DELETE',
        }),

      toggleFavorite: (id) =>
        request(`/contacts/${id}/favorite`, {
          method: 'PATCH',
        }),

      getStats: () => request('/contacts/stats/summary', { method: 'GET' }),
    },
  };
})();
