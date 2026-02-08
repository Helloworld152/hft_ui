const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8866/api`;

export const fetchAccountsList = async () => {
  const response = await fetch(`${API_BASE_URL}/account/list`);
  if (!response.ok) throw new Error('Failed to fetch accounts list');
  return response.json();
};

export const fetchAccountStatus = async (accountId?: string) => {
  let url = `${API_BASE_URL}/account/status`;
  if (accountId) url += `?account_id=${accountId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch account status');
  return response.json();
};

export const fetchTrades = async (limit = 100, accountId?: string) => {
  let url = `${API_BASE_URL}/trades/?limit=${limit}`;
  if (accountId) url += `&account_id=${accountId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch trades');
  return response.json();
};

export const fetchOrders = async (limit = 100, accountId?: string) => {
  let url = `${API_BASE_URL}/orders/?limit=${limit}`;
  if (accountId) url += `&account_id=${accountId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

export const placeOrder = async (order: any) => {
  const response = await fetch(`${API_BASE_URL}/orders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error('Failed to place order');
  return response.json();
};

export const cancelOrder = async (cancelData: { symbol: string, client_id: string, account_id?: string }) => {
  let url = `${API_BASE_URL}/orders/${cancelData.client_id}?symbol=${cancelData.symbol}`;
  if (cancelData.account_id) url += `&account_id=${cancelData.account_id}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to cancel order');
  return response.json();
};

export const fetchPositions = async (accountId?: string) => {
  let url = `${API_BASE_URL}/positions/`;
  if (accountId) url += `?account_id=${accountId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch positions');
  return response.json();
};

export const fetchAccount = async (accountId?: string) => {
  let url = `${API_BASE_URL}/account/`;
  if (accountId) url += `?account_id=${accountId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch account');
  return response.json();
};

export const fetchEquityHistory = async (limit = 500, accountId?: string) => {
  let url = `${API_BASE_URL}/equity/history?limit=${limit}`;
  if (accountId) url += `&account_id=${accountId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch equity history');
  return response.json();
};
