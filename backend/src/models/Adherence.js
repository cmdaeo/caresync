const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Adherence = sequelize.define('Adherence', {
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
