const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CaregiverPatient = sequelize.define('CaregiverPatient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    caregiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    relationship: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {
        canViewMedications: true,
        canViewAdherence: true,
        canManageMedications: false,
        canReceiveAlerts: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'caregiver_patients',
    timestamps: true
  });

  // Method to check if caregiver has access to patient
  CaregiverPatient.prototype.hasAccess = function() {
    return this.isActive && this.isVerified;
  };

  return CaregiverPatient;
};
