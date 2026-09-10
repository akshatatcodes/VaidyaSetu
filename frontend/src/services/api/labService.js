import apiClient from './client';

export const labService = {
  getPendingOrders: () => apiClient.get('/lab/pending'),
  getCounts: () => apiClient.get('/lab/dashboard-counts'),
  saveResult: (payload) => apiClient.post('/lab/results/entry', payload),
  verifyResult: (orderId) => apiClient.post(`/lab/results/${orderId}/verify`)
};

export default labService;
