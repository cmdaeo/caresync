const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeviceAccessPermission = sequelize.define('DeviceAccessPermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    accessLevel: {
      type: DataTypes.ENUM('read_only', 'full_access'),
      allowNull: false,
      defaultValue: 'read_only'
    },
    grantedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'device_access_permissions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['deviceId', 'userId']
      }
    ]
  });

  return DeviceAccessPermission;
};