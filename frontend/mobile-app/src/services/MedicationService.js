import AuthService from './AuthService';
import { ENDPOINTS } from '../config/api';

class MedicationService {
  /**
   * Get all medications for the current user
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of medications
   */
  async getMedications(filters = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(ENDPOINTS.MEDICATIONS.BASE, { params: filters });
      return response.data.data.medications || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get medication by ID
   * @param {string} id - Medication ID
   * @returns {Promise<Object>} Medication details
   */
  async getMedication(id) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(ENDPOINTS.MEDICATIONS.DETAILS(id));
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Create new medication
   * @param {Object} medicationData - Medication information
   * @returns {Promise<Object>} Created medication
   */
  async createMedication(medicationData) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(ENDPOINTS.MEDICATIONS.BASE, medicationData);
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Update medication
   * @param {string} id - Medication ID
   * @param {Object} medicationData - Updated medication data
   * @returns {Promise<Object>} Updated medication
   */
  async updateMedication(id, medicationData) {
    try {
      const api = AuthService.getApi();
      const response = await api.put(ENDPOINTS.MEDICATIONS.DETAILS(id), medicationData);
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Delete medication
   * @param {string} id - Medication ID
   * @returns {Promise<void>}
   */
  async deleteMedication(id) {
    try {
      const api = AuthService.getApi();
      await api.delete(ENDPOINTS.MEDICATIONS.DETAILS(id));
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get medication schedule
   * @param {string} id - Medication ID
   * @returns {Promise<Object>} Medication schedule
   */
  async getMedicationSchedule(id) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(ENDPOINTS.MEDICATIONS.SCHEDULE(id));
      return response.data.data.schedule || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Update medication schedule
   * @param {string} id - Medication ID
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Updated schedule
   */
  async updateMedicationSchedule(id, scheduleData) {
    try {
      const api = AuthService.getApi();
      const response = await api.put(ENDPOINTS.MEDICATIONS.SCHEDULE(id), scheduleData);
      return response.data.data.schedule || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get medication reminders
   * @param {string} id - Medication ID
   * @returns {Promise<Object>} Medication reminders
   */
  async getMedicationReminders(id) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(ENDPOINTS.MEDICATIONS.REMINDERS(id));
      return response.data.data.reminders || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Update medication reminders
   * @param {string} id - Medication ID
   * @param {Object} reminderData - Reminder settings
   * @returns {Promise<Object>} Updated reminders
   */
  async updateMedicationReminders(id, reminderData) {
    try {
      const api = AuthService.getApi();
      const response = await api.put(ENDPOINTS.MEDICATIONS.REMINDERS(id), reminderData);
      return response.data.data.reminders || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get today's medications
   * @returns {Promise<Array>} Today's medication schedule
   */
  async getTodaysMedications() {
    try {
      const api = AuthService.getApi();
      const response = await api.get(`${ENDPOINTS.MEDICATIONS.BASE}/today`);
      return response.data.data.medications || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get upcoming medications (next 24 hours)
   * @returns {Promise<Array>} Upcoming medications
   */
  async getUpcomingMedications() {
    try {
      const api = AuthService.getApi();
      const response = await api.get(`${ENDPOINTS.MEDICATIONS.BASE}/upcoming`);
      return response.data.data.medications || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get medication statistics
   * @returns {Promise<Object>} Medication statistics
   */
  async getMedicationStatistics() {
    try {
      const api = AuthService.getApi();
      const response = await api.get(`${ENDPOINTS.MEDICATIONS.BASE}/statistics`);
      return response.data.data.statistics || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Check medication interactions
   * @param {Array} medicationIds - Array of medication IDs
   * @returns {Promise<Object>} Interaction data
   */
  async checkMedicationInteractions(medicationIds) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(`${ENDPOINTS.MEDICATIONS.BASE}/interactions`, {
        medicationIds
      });
      return response.data.data || response.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get low stock medications
   * @returns {Promise<Array>} Low stock medications
   */
  async getLowStockMedications() {
    try {
      const api = AuthService.getApi();
      const response = await api.get(`${ENDPOINTS.MEDICATIONS.BASE}/low-stock`);
      return response.data.data.medications || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Update medication stock
   * @param {string} id - Medication ID
   * @param {Object} stockData - Stock information
   * @returns {Promise<Object>} Updated medication
   */
  async updateMedicationStock(id, stockData) {
    try {
      const api = AuthService.getApi();
      const response = await api.put(`${ENDPOINTS.MEDICATIONS.DETAILS(id)}/stock`, stockData);
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Mark medication as taken
   * @param {string} id - Medication ID
   * @param {Object} data - Taken medication data
   * @returns {Promise<Object>} Updated medication
   */
  async markMedicationTaken(id, data = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(`${ENDPOINTS.MEDICATIONS.DETAILS(id)}/taken`, {
        takenAt: new Date().toISOString(),
        ...data
      });
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Mark medication as missed
   * @param {string} id - Medication ID
   * @param {Object} data - Missed medication data
   * @returns {Promise<Object>} Updated medication
   */
  async markMedicationMissed(id, data = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(`${ENDPOINTS.MEDICATIONS.DETAILS(id)}/missed`, {
        missedAt: new Date().toISOString(),
        ...data
      });
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Skip medication dose
   * @param {string} id - Medication ID
   * @param {Object} data - Skip data
   * @returns {Promise<Object>} Updated medication
   */
  async skipMedicationDose(id, data = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(`${ENDPOINTS.MEDICATIONS.DETAILS(id)}/skip`, {
        skippedAt: new Date().toISOString(),
        ...data
      });
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Snooze medication reminder
   * @param {string} id - Medication ID
   * @param {Object} data - Snooze data
   * @returns {Promise<Object>} Updated medication
   */
  async snoozeMedicationReminder(id, data = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(`${ENDPOINTS.MEDICATIONS.DETAILS(id)}/snooze`, {
        snoozeUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        ...data
      });
      return response.data.data.medication || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }
}

export default new MedicationService();