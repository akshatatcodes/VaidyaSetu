import apiClient from './client';

export const patientService = {
  getProfile: (patientId) => apiClient.get(`/patients/${patientId}`),
  getMedications: (patientId) => apiClient.get(`/medications/patient/${patientId}`),
  getVitals: (patientId) => apiClient.get(`/vitals/latest/${patientId}`),
  getQueueStatus: (patientId) => apiClient.get(`/queues/patient/${patientId}`)
};

export default patientService;
