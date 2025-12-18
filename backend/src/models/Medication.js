const { DataTypes } = require('sequelize');
const Encrypted = require('sequelize-encrypted');

module.exports = (sequelize) => {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  const Medication = sequelize.define('Medication', {
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
    name: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false
    },
    dosage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    dosageUnit: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false
    },
    frequency: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false
    },
    timesPerDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    route: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: true
    },
    instructions: {
      type: Encrypted(DataTypes.TEXT, encryptionKey),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remainingQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    totalQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    compartment: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12
      }
    },
    refillReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'medications',
    timestamps: true
  });

  return Medication;
};
