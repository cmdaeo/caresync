import AuthService from './AuthService';
import { ENDPOINTS } from '../config/api';

class AdherenceService {
  /**
   * Get adherence records
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of adherence records
   */
  async getAdherenceRecords(filters = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(ENDPOINTS.ADHERENCE.BASE, { params: filters });
      return response.data.data.adherenceRecords || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get single adherence record
   * @param {string} id - Adherence record ID
   * @returns {Promise<Object>} Adherence record details
   */
  async getAdherenceRecord(id) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(ENDPOINTS.ADHERENCE.DETAILS(id));
      return response.data.data.adherenceRecord || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Record medication adherence
   * @param {Object} adherenceData - Adherence data
   * @returns {Promise<Object>} Created adherence record
   */
  async recordAdherence(adherenceData) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(ENDPOINTS.ADHERENCE.BASE, adherenceData);
      return response.data.data.adherenceRecord || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Update adherence record
   * @param {string} id - Adherence record ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated adherence record
   */
  async updateAdherenceRecord(id, updateData) {
    try {
      const api = AuthService.getApi();
      const response = await api.put(ENDPOINTS.ADHERENCE.DETAILS(id), updateData);
      return response.data.data.adherenceRecord || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get adherence statistics
   * @param {Object} options - Statistics options
   * @returns {Promise<Object>} Adherence statistics
   */
  async getAdherenceStatistics(options = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(`${ENDPOINTS.ADHERENCE.BASE}/stats`, { params: options });
      return response.data.data || response.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get adherence trends
   * @param {Object} options - Trend options
   * @returns {Promise<Array>} Adherence trends data
   */
  async getAdherenceTrends(options = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(`${ENDPOINTS.ADHERENCE.BASE}/trends`, { params: options });
      return response.data.data.trends || response.data.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get medication-specific adherence
   * @param {string} medicationId - Medication ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Medication adherence data
   */
  async getMedicationAdherence(medicationId, options = {}) {
    try {
      const api = AuthService.getApi();
      const response = await api.get(`${ENDPOINTS.ADHERENCE.BASE}/medication/${medicationId}`, { params: options });
      return response.data.data || response.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Bulk record adherence (for device sync)
   * @param {Array} adherenceRecords - Array of adherence records
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkRecordAdherence(adherenceRecords, deviceId = null) {
    try {
      const api = AuthService.getApi();
      const response = await api.post(`${ENDPOINTS.ADHERENCE.BASE}/bulk`, {
        adherenceRecords,
        deviceId
      });
      return response.data.data || response.data;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Mark medication as taken
   * @param {string} medicationId - Medication ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Adherence record
   */
  async markMedicationTaken(medicationId, options = {}) {
    try {
      const adherenceData = {
        medicationId,
        status: 'taken',
        takenTime: new Date().toISOString(),
        confirmationMethod: options.confirmationMethod || 'manual',
        ...options
      };

      return await this.recordAdherence(adherenceData);
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Mark medication as missed
   * @param {string} medicationId - Medication ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Adherence record
   */
  async markMedicationMissed(medicationId, options = {}) {
    try {
      const adherenceData = {
        medicationId,
        status: 'missed',
        confirmationMethod: options.confirmationMethod || 'manual',
        ...options
      };

      return await this.recordAdherence(adherenceData);
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Mark medication as delayed
   * @param {string} medicationId - Medication ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Adherence record
   */
  async markMedicationDelayed(medicationId, options = {}) {
    try {
      const adherenceData = {
        medicationId,
        status: 'delayed',
        takenTime: new Date().toISOString(),
        confirmationMethod: options.confirmationMethod || 'manual',
        ...options
      };

      return await this.recordAdherence(adherenceData);
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Mark medication as skipped
   * @param {string} medicationId - Medication ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Adherence record
   */
  async markMedicationSkipped(medicationId, options = {}) {
    try {
      const adherenceData = {
        medicationId,
        status: 'skipped',
        confirmationMethod: options.confirmationMethod || 'manual',
        ...options
      };

      return await this.recordAdherence(adherenceData);
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Get today's adherence summary
   * @returns {Promise<Object>} Today's adherence summary
   */
  async getTodaysAdherence() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const records = await this.getAdherenceRecords({
        dateFrom: startOfDay,
        dateTo: endOfDay
      });

      const summary = {
        totalScheduled: records.length,
        taken: records.filter(r => r.status === 'taken').length,
        missed: records.filter(r => r.status === 'missed').length,
        delayed: records.filter(r => r.status === 'delayed').length,
        skipped: records.filter(r => r.status === 'skipped').length,
        adherenceRate: 0
      };

      summary.adherenceRate = summary.totalScheduled > 0 
        ? Math.round((summary.taken / summary.totalScheduled) * 100)
        : 0;

      return {
        summary,
        records
      };
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }

  /**
   * Calculate adherence rate for a time period
   * @param {string} period - Period ('week', 'month', 'year')
   * @param {string} medicationId - Optional medication ID
   * @returns {Promise<number>} Adherence rate percentage
   */
  async getAdherenceRate(period = 'month', medicationId = null) {
    try {
      const stats = await this.getAdherenceStatistics({ 
        period,
        medicationId 
      });

      return stats.statistics?.adherenceRate || 0;
    } catch (error) {
      throw AuthService.handleError ? AuthService.handleError(error) : error;
    }
  }
}

export default new AdherenceService();