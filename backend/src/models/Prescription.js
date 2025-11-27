const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: false
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false
    },
    instructions: {
      type: DataTypes.TEXT,
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
