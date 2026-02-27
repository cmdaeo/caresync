const { DataTypes } = require('sequelize');
const Encrypted = require('sequelize-encrypted');

module.exports = (sequelize) => {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  const Prescription = sequelize.define('Prescription', {
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
    medicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'medications',
        key: 'id'
      }
    },
    prescribedBy: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: true
    },
    prescribedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dosage: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false
    },
    frequency: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false
    },
    instructions: {
      type: Encrypted(DataTypes.TEXT, encryptionKey),
      allowNull: true
    },
    refillsRemaining: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'prescriptions',
    timestamps: true
  });

  return Prescription;
};
