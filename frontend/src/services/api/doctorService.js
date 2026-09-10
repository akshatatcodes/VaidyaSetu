import apiClient from './client';

export const doctorService = {
  getQueue: (department) => apiClient.get(`/kiosk/queue${department ? `?department=${department}` : ''}`),
  getEncounter: (encounterId) => apiClient.get(`/kiosk/session/${encounterId}`),
  approveEncounter: (encounterId, payload) => apiClient.post(`/kiosk/session/${encounterId}/approve`, payload)
};

export default doctorService;
