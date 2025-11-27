import client from './client';

// Based on your backend/src/controllers/authController.js
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'patient' | 'caregiver' | 'admin';
      phone?: string;
      dateOfBirth?: string;
      preferences?: any;
    };
    token: string;
    refreshToken: string;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'caregiver';
  phone?: string;
  dateOfBirth?: string;
}

// Fixed: removed redundant email and password parameters
export const login = async (email: string, password: string) => {
  const response = await client.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData: RegisterData) => {
  const response = await client.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await client.get('/auth/me'); 
  return response.data;
};
