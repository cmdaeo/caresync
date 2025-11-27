import client from './client';

// --- Medications ---
export const getMedications = async () => {
  const response = await client.get('/medications');
  return response.data;
};

export const getMedicationById = async (id: string) => {
  const response = await client.get(`/medications/${id}`);
  return response.data;
};

export const addMedication = async (medData: any) => {
  const response = await client.post('/medications', medData);
  return response.data;
};

export const updateMedication = async (id: string, medData: any) => {
  const response = await client.put(`/medications/${id}`, medData);
  return response.data;
};

export const deleteMedication = async (id: string) => {
  const response = await client.delete(`/medications/${id}`);
  return response.data;
};

export const getRefillNeeded = async () => {
  const response = await client.get('/medications/refill-needed');
  return response.data;
};

export const getUpcomingDoses = async (hours: number = 24) => {
  const response = await client.get(`/medications/upcoming-doses?hours=${hours}`);
  return response.data;
};

export const refillMedication = async (id: string, quantity: number) => {
  const response = await client.post(`/medications/${id}/refill`, { quantity });
  return response.data;
};

export const getMedicationStats = async () => {
  const response = await client.get('/medications/stats');
  return response.data;
};

// --- Adherence ---
export const logAdherenceRecord = async (data: { medicationId: string; status: string; takenAt?: Date }) => {
  const response = await client.post('/adherence', data);
  return response.data;
};

export const getAdherenceStats = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await client.get(`/adherence/stats?${params.toString()}`);
  return response.data;
};

export const getAdherenceTrends = async () => {
  const response = await client.get('/adherence/trends');
  return response.data;
};

// --- Schedule ---
export const getDailySchedule = async (date: string) => {
  const response = await client.get(`/prescriptions/schedule?date=${date}`);
  return response.data;
};

// --- Notifications ---
export const getAllNotifications = async (read: boolean = false) => {
  const response = await client.get(`/notifications?read=${read}`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await client.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await client.patch(`/notifications/${id}/read`);
  return response.data;
};

// --- Caregivers ---
export const getCaregivers = async () => {
  const response = await client.get('/caregivers');
  return response.data;
};

export const inviteCaregiver = async (email: string, relationship: string) => {
  const response = await client.post('/caregivers/invite', { email, relationship });
  return response.data;
};

export const removeCaregiver = async (id: string) => {
  const response = await client.delete(`/caregivers/${id}`);
  return response.data;
};

// --- Devices ---
export const getDevices = async () => {
  const response = await client.get('/devices');
  return response.data;
};

export const getDeviceById = async (id: string) => {
  const response = await client.get(`/devices/${id}`);
  return response.data;
};

export const registerDevice = async (deviceData: any) => {
  const response = await client.post('/devices', deviceData);
  return response.data;
};

export const updateDevice = async (id: string, deviceData: any) => {
  const response = await client.put(`/devices/${id}`, deviceData);
  return response.data;
};

export const deleteDevice = async (id: string) => {
  const response = await client.delete(`/devices/${id}`);
  return response.data;
};

// --- Profile ---
export const updateProfile = async (profileData: any) => {
  const response = await client.put('/auth/profile', profileData);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await client.put('/auth/password', { currentPassword, newPassword });
  return response.data;
};

// --- Reports ---
export const generatePDFReport = async (startDate: string, endDate: string) => {
  const response = await client.get(`/adherence/report/pdf`, {
    params: { startDate, endDate },
    responseType: 'blob',
  });
  return response;
};
