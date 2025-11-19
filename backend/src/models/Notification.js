const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  caregiverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'medication_reminder',
      'missed_dose',
      'refill_reminder',
      'device_alert',
      'system_alert',
      'caregiver_alert'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryMethod: {
    type: DataTypes.ENUM('push', 'email', 'sms', 'in_app'),
    defaultValue: 'push'
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  actionText: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [1, 50]
    }
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  relatedEntityType: {
    type: DataTypes.ENUM('medication', 'prescription', 'device', 'adherence', 'user'),
    allowNull: true
  },
  relatedEntityId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['caregiverId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['userId', 'isRead']
    },
    {
      fields: ['caregiverId', 'isRead']
    }
  ]
});

// Instance methods
Notification.prototype.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

Notification.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

Notification.prototype.shouldSend = function() {
  if (this.sentAt) return false;
  if (this.isExpired()) return false;
  if (this.scheduledFor && new Date() < this.scheduledFor) return false;
  return true;
};

// Class methods
Notification.findUnreadForUser = function(userId) {
  return this.findAll({
    where: {
      userId: userId,
      isRead: false,
      [require('sequelize').Op.or]: [
        { expiresAt: null },
        { expiresAt: { [require('sequelize').Op.gte]: new Date() } }
      ]
    },
    order: [['createdAt', 'DESC']]
  });
};

Notification.findUnreadForCaregiver = function(caregiverId) {
  return this.findAll({
    where: {
      caregiverId: caregiverId,
      isRead: false,
      [require('sequelize').Op.or]: [
        { expiresAt: null },
        { expiresAt: { [require('sequelize').Op.gte]: new Date() } }
      ]
    },
    order: [['createdAt', 'DESC']]
  });
};

Notification.markAllAsReadForUser = function(userId) {
  return this.update(
    { isRead: true, readAt: new Date() },
    {
      where: {
        userId: userId,
        isRead: false
      }
    }
  );
};

module.exports = Notification;