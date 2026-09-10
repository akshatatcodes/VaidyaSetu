import apiClient from './client';

export const adminService = {
  getStats: () => apiClient.get('/admin/stats'),
  getDepartments: () => apiClient.get('/admin/departments'),
  getAuditLog: () => apiClient.get('/admin/audit-log')
};

export default adminService;
