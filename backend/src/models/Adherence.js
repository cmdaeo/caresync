const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Adherence = sequelize.define('Adherence', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'UUID link to users table in PII database'
    },
    medicationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    takenAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('taken', 'missed', 'skipped'),
      allowNull: false,
      defaultValue: 'taken'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'adherence',
    timestamps: true
  });

  return Adherence;
};
