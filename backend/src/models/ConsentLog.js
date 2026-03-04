const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsentLog = sequelize.define('ConsentLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    consentType: {
      type: DataTypes.ENUM(
        'symptom_processing',     // Processing of symptom/health data
        'medication_tracking',    // Tracking medication adherence
        'doctor_sharing',         // Sharing data with healthcare providers
        'caregiver_sharing',      // Sharing data with caregivers
        'analytics',              // Anonymised usage analytics
        'push_notifications',     // Push notification consent
        'email_notifications'     // Email notification consent
      ),
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('grant', 'revoke'),
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'consent_logs',
    timestamps: true,
    updatedAt: false, // Consent logs are immutable — append-only
    paranoid: false
  });

  return ConsentLog;
};
