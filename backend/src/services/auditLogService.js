const { AuditLog } = require('../models');

class AuditLogService {
  /**
   * Create an audit log entry
   */
  static async logAction({ userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent, metadata }) {
    try {
      const logEntry = await AuditLog.create({
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        metadata
      });
      return logEntry;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
      return null;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId) {
    return await AuditLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditLogs(entityType, entityId) {
    return await AuditLog.findAll({
      where: { entityType, entityId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get all audit logs (for admin purposes)
   */
  static async getAllAuditLogs() {
    return await AuditLog.findAll({
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = AuditLogService;