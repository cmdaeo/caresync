const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define('Device', {
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
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deviceType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firmwareVersion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    connectionStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    devicePublicKey: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registrationSignature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'devices',
    timestamps: true
  });

  return Device;
};
