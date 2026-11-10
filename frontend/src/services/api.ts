export const API_ROOT = (((import.meta as any).env?.VITE_API_URL as string) || '').replace(/\/$/, '');
export const API_BASE = `${API_ROOT}/api/v1`;

export const getAuthToken = (): string | null => {
  return localStorage.getItem('aurelia_auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('aurelia_auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('aurelia_auth_token');
  localStorage.removeItem('aurelia_user');
};

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
};

export const api = {
  // Public Customer
  getPublicRestaurant: (slug: string = 'tejas') => authFetch(`/public/restaurant/${slug}`),
  getPublicTables: (slug: string = 'tejas') => authFetch(`/public/tables/${slug}`),
  validateTable: (slug: string, token: string) => authFetch(`/public/validate-table/${slug}/${token}`),
  placeOrder: (data: any) => authFetch('/public/order', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerOrder: (orderId: string) => authFetch(`/public/order/${orderId}`),
  payOrder: (orderId: string, paymentData: any) =>
    authFetch(`/public/order/${orderId}/pay`, { method: 'POST', body: JSON.stringify(paymentData) }),
  callWaiter: (slug: string, data: { table_number: string; request_type: string; notes?: string }) =>
    authFetch(`/public/restaurant/${slug}/call-waiter`, { method: 'POST', body: JSON.stringify(data) }),
  askAIAssistant: (slug: string, data: { prompt: string; table_number?: string; order_id?: string }) =>
    authFetch(`/public/restaurant/${slug}/ai-assistant`, { method: 'POST', body: JSON.stringify(data) }),

  // Auth
  login: (data: any) => authFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => authFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentUser: () => authFetch('/auth/me'),

  // Kitchen
  getKitchenOrders: () => authFetch('/kitchen/orders'),
  updateKitchenOrderStatus: (orderId: string, status: string, notes?: string) =>
    authFetch(`/kitchen/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    }),

  // Tables
  getTables: () => authFetch('/tables'),
  createTable: (data: any) => authFetch('/tables', { method: 'POST', body: JSON.stringify(data) }),
  updateTable: (tableId: string, data: any) => authFetch(`/tables/${tableId}`, { method: 'PUT', body: JSON.stringify(data) }),
  regenerateTableQR: (tableId: string) => authFetch(`/tables/${tableId}/regenerate-qr`, { method: 'POST' }),
  deleteTable: (tableId: string) => authFetch(`/tables/${tableId}`, { method: 'DELETE' }),

  // Menu
  getCategories: () => authFetch('/menu/categories'),
  createCategory: (data: any) => authFetch('/menu/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => authFetch(`/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => authFetch(`/menu/categories/${id}`, { method: 'DELETE' }),

  getMenuItems: () => authFetch('/menu/items'),
  createMenuItem: (data: any) => authFetch('/menu/items', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: string, data: any) => authFetch(`/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleItemAvailability: (id: string) => authFetch(`/menu/items/${id}/availability`, { method: 'PATCH' }),
  deleteMenuItem: (id: string) => authFetch(`/menu/items/${id}`, { method: 'DELETE' }),

  // Orders Management
  getOrders: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return authFetch(`/orders${q ? `?${q}` : ''}`);
  },
  getOrderDetails: (id: string) => authFetch(`/orders/${id}`),
  cancelOrder: (id: string, reason: string) => authFetch(`/orders/${id}/cancel?reason=${encodeURIComponent(reason)}`, { method: 'POST' }),
  updateOrderPayment: (id: string, paymentStatus: string, paymentMethod = 'CASH') =>
    authFetch(`/orders/${id}/payment?payment_status=${paymentStatus}&payment_method=${paymentMethod}`, { method: 'POST' }),

  // Analytics
  getAnalytics: () => authFetch('/analytics/summary'),

  // Staff
  getStaff: () => authFetch('/staff'),
  addStaff: (data: any) => authFetch('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id: string, data: any) => authFetch(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => authFetch('/settings'),
  updateProfile: (data: any) => authFetch('/settings/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateOperational: (data: any) => authFetch('/settings/operational', { method: 'PUT', body: JSON.stringify(data) }),
};
