import client from './client';

// --- Medications ---
export const getMedications = async (patientId?: string) => {
  const query = patientId ? `?patientId=${patientId}` : '';
  const response = await client.get(`/medications${query}`);
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

export const getRefillNeeded = async (patientId?: string) => {
  const query = patientId ? `?patientId=${patientId}` : '';
  const response = await client.get(`/medications/refill-needed${query}`);
  return response.data;
};

export const getUpcomingDoses = async (hours = 24, patientId?: string) => {
  let query = `?hours=${hours}`;
  if (patientId) query += `&patientId=${patientId}`;
  const response = await client.get(`/medications/upcoming-doses${query}`);
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

// --- Adherence (Updated Paths) ---
export const logAdherenceRecord = async (data: { 
  medicationId: string; 
  status: string; 
  takenAt?: Date | string; 
  scheduledTime?: Date | string; // ADDED: Backend requires this now
}) => {
  // CHANGED: /adherence -> /medications/adherence
  const response = await client.post('/medications/adherence', data);
  return response.data;
};

export const getAdherenceStats = async (startDate?: string, endDate?: string, patientId?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (patientId) params.append('patientId', patientId);
  
  // CHANGED: /adherence/stats -> /medications/adherence/stats
  const response = await client.get(`/medications/adherence/stats?${params.toString()}`);
  return response.data;
};

export const getAdherenceTrends = async () => {
  // CHANGED: /adherence/trends -> /medications/adherence/trends (Ensure you have this route in backend if used)
  const response = await client.get('/medications/adherence/trends');
  return response.data;
};

// --- Schedule ---
export const getDailySchedule = async (date: string) => {
  // NOTE: Assuming /prescriptions/schedule is handled elsewhere or should also be updated.
  // If your merged controller handles this via getCalendarData, verify this path.
  // Keeping as is based on your previous file, but check if this needs to change to /medications/schedule/daily
  const response = await client.get(`/medications/schedule?startDate=${date}&endDate=${date}`);
  return response.data;
};

// --- Calendar (Updated Paths) ---
export const getCalendarData = async (startDate?: string, endDate?: string, patientId?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (patientId) params.append('patientId', patientId);
  
  // CHANGED: /calendar -> /medications/schedule
  const response = await client.get(`/medications/schedule?${params.toString()}`);
  return response.data;
};

export const getMedicationCalendarData = async (medicationId: string, startDate?: string, endDate?: string, patientId?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (patientId) params.append('patientId', patientId);
  
  // CHANGED: /calendar/medication/:id -> /medications/schedule/:id
  // Note: Ensure your backend route structure supports this if you need specific med calendar
  const response = await client.get(`/medications/schedule/${medicationId}?${params.toString()}`);
  return response.data;
};

// --- Caregiver Medication Management ---
export const getAvailableCompartments = async (patientId?: string) => {
  const params = new URLSearchParams();
  if (patientId) params.append('patientId', patientId);
  
  const response = await client.get(`/medications/compartments/available?${params.toString()}`);
  return response.data;
};

export const createMedicationForPatient = async (patientId: string, medData: any) => {
  const response = await client.post('/medications/patient', { patientId, ...medData });
  return response.data;
};

export const getPatientMedications = async (patientId: string) => {
  const response = await client.get(`/medications/patient/${patientId}`);
  return response.data;
};

export const updatePatientMedication = async (medicationId: string, medData: any) => {
  const response = await client.put(`/medications/patient/${medicationId}`, medData);
  return response.data;
};

export const deletePatientMedication = async (medicationId: string) => {
  const response = await client.delete(`/medications/patient/${medicationId}`);
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

export const getPatients = async () => {
  const response = await client.get('/patients');
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

export const getPendingInvitations = async () => {
  const response = await client.get('/caregivers/pending');
  return response.data;
};

export const acceptInvitation = async (id: string) => {
  const response = await client.post(`/caregivers/${id}/accept`);
  return response.data;
};

export const declineInvitation = async (id: string) => {
  const response = await client.post(`/caregivers/${id}/decline`);
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

export const registerDeviceWithSignature = async (deviceData: {
  deviceId: string;
  devicePublicKey: string;
  signature: string;
  name?: string;
  deviceType?: string;
  model?: string;
  serialNumber?: string;
}) => {
  const response = await client.post('/devices/register-with-signature', deviceData);
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

// --- Device Caregiver Management ---
export const inviteDeviceCaregiver = async (deviceId: string, email: string, accessLevel: 'read_only' | 'full_access' = 'read_only') => {
  const response = await client.post(`/devices/${deviceId}/invite-caregiver`, { email, accessLevel });
  return response.data;
};

export const acceptDeviceCaregiverInvitation = async (deviceId: string, invitationId: string) => {
  const response = await client.post(`/devices/${deviceId}/caregivers/${invitationId}/accept`);
  return response.data;
};

export const getDeviceCaregivers = async (deviceId: string) => {
  const response = await client.get(`/devices/${deviceId}/caregivers`);
  return response.data;
};

export const removeDeviceCaregiver = async (deviceId: string, caregiverId: string) => {
  const response = await client.delete(`/devices/${deviceId}/caregivers/${caregiverId}`);
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

export const deleteAccount = async (password: string) => {
  const response = await client.delete('/auth/account', { data: { password } });
  return response.data;
};

// --- Reports ---
export const generatePDFReport = async (startDate: string, endDate: string) => {
  const response = await client.get(`/reports/pdf`, {
    params: { startDate, endDate },
    responseType: 'blob',
  });
  return response;
};
