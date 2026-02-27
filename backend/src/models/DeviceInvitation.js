const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeviceInvitation = sequelize.define('DeviceInvitation', {
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    accessLevel: {
      type: DataTypes.ENUM('read_only', 'full_access'),
      allowNull: false,
      defaultValue: 'read_only'
    },
    invitationToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired', 'revoked'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'device_invitations',
    timestamps: true
  });

  return DeviceInvitation;
};