// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://caresync-api.yourdomain.com';

export const API_TIMEOUT = 10000;

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/password'
  },

  // Users
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    SETTINGS: '/api/users/settings'
  },

  // Medications
  MEDICATIONS: {
    BASE: '/api/medications',
    DETAILS: (id) => `/api/medications/${id}`,
    SCHEDULE: (id) => `/api/medications/${id}/schedule`,
    REMINDERS: (id) => `/api/medications/${id}/reminders`
  },

  // Prescriptions
  PRESCRIPTIONS: {
    BASE: '/api/prescriptions',
    UPLOAD: '/api/prescriptions/upload',
    DETAILS: (id) => `/api/prescriptions/${id}`,
    REVIEW: (id) => `/api/prescriptions/${id}/review`,
    NEEDING_REVIEW: '/api/prescriptions/needing-review',
    STATS: '/api/prescriptions/stats'
  },

  // Adherence
  ADHERENCE: {
    BASE: '/api/adherence',
    DAILY: '/api/adherence/daily',
    WEEKLY: '/api/adherence/weekly',
    MONTHLY: '/api/adherence/monthly',
    DETAILS: (id) => `/api/adherence/${id}`,
    STATS: '/api/adherence/stats'
  },

  // Caregivers
  CAREGIVERS: {
    BASE: '/api/caregivers',
    INVITE: '/api/caregivers/invite',
    PATIENTS: '/api/caregivers/patients',
    DETAILS: (id) => `/api/caregivers/${id}`,
    RELATIONSHIP: (id) => `/api/caregivers/${id}/relationship`
  },

  // Devices
  DEVICES: {
    BASE: '/api/devices',
    PAIR: '/api/devices/pair',
    STATUS: (id) => `/api/devices/${id}/status`,
    SYNC: (id) => `/api/devices/${id}/sync`,
    CONFIG: (id) => `/api/devices/${id}/config`
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    PREFERENCES: '/api/notifications/preferences',
    TEST: '/api/notifications/test'
  }
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]{10,}$/,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_PDF_TYPES: ['application/pdf']
};

// App Constants
export const APP_CONSTANTS = {
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  
  // Medication reminder intervals
  REMINDER_INTERVALS: {
    BEFORE_5_MIN: 5,
    BEFORE_15_MIN: 15,
    BEFORE_30_MIN: 30,
    BEFORE_60_MIN: 60
  },

  // Notification types
  NOTIFICATION_TYPES: {
    MEDICATION_REMINDER: 'medication_reminder',
    MISSED_DOSE: 'missed_dose',
    REFILL_REMINDER: 'refill_reminder',
    SYSTEM_ALERT: 'system_alert',
    CAREGIVER_MESSAGE: 'caregiver_message'
  },

  // Adherence statuses
  ADHERENCE_STATUS: {
    TAKEN: 'taken',
    MISSED: 'missed',
    DELAYED: 'delayed',
    SKIPPED: 'skipped'
  },

  // Device types
  DEVICE_TYPES: {
    CAREBOX: 'carebox',
    CAREBAND: 'careband'
  },

  // User roles
  USER_ROLES: {
    PATIENT: 'patient',
    CAREGIVER: 'caregiver',
    HEALTHCARE_PROVIDER: 'healthcare_provider',
    ADMIN: 'admin'
  },

  // Color themes
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    HIGH_CONTRAST: 'high_contrast'
  },

  // Languages
  LANGUAGES: {
    EN: 'en',
    PT: 'pt',
    ES: 'es',
    FR: 'fr'
  }
};

// AsyncStorage Keys
export const STORAGE_KEYS = {
  TOKEN: '@caresync:token',
  REFRESH_TOKEN: '@caresync:refresh_token',
  USER: '@caresync:user',
  THEME: '@caresync:theme',
  LANGUAGE: '@caresync:language',
  NOTIFICATION_PREFS: '@caresync:notification_prefs',
  OFFLINE_DATA: '@caresync:offline_data',
  LAST_SYNC: '@caresync:last_sync'
};

// Navigation Routes
export const NAVIGATION_ROUTES = {
  AUTH: {
    SPLASH: 'Splash',
    WELCOME: 'Welcome',
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword'
  },
  MAIN: {
    HOME: 'Home',
    MEDICATIONS: 'Medications',
    ADHERENCE: 'Adherence',
    PROFILE: 'Profile'
  },
  MEDICATIONS: {
    LIST: 'Medications',
    DETAILS: 'MedicationDetails',
    ADD: 'AddMedication',
    EDIT: 'EditMedication',
    SCHEDULE: 'MedicationSchedule'
  },
  PRESCRIPTIONS: {
    LIST: 'Prescriptions',
    DETAILS: 'PrescriptionDetails',
    UPLOAD: 'UploadPrescription',
    REVIEW: 'ReviewPrescription'
  },
  SETTINGS: {
    SETTINGS: 'Settings',
    PROFILE: 'Profile',
    NOTIFICATIONS: 'Notifications',
    ACCESSIBILITY: 'Accessibility',
    DEVICES: 'Devices',
    CAREGIVERS: 'Caregivers'
  }
};