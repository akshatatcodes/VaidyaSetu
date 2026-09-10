import apiClient from './client';

export const kioskService = {
  startSession: (payload) => apiClient.post('/kiosk/session/start', payload),
  updateVitals: (id, vitals) => apiClient.patch(`/kiosk/session/${id}/vitals`, vitals),
  generateSoap: (id) => apiClient.post(`/kiosk/session/${id}/generate-soap`)
};

export default kioskService;
