const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
      type: DataTypes.STRING,
      allowNull: false
    },
    dosage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    dosageUnit: {
      type: DataTypes.STRING,
      allowNull: false
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timesPerDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    route: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
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
