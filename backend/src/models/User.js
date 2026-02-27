const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const Encrypted = require('sequelize-encrypted');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize) => {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  /**
   * Safe decryption helper: tries to decrypt, falls back to returning
   * the raw value if decryption fails (handles pre-existing plaintext data).
   */
  const safeDecrypt = (value) => {
    if (!value) return value;
    try {
      return decrypt(value);
    } catch {
      // Value was stored before encryption was enabled — return as-is
      return value;
    }
  };

  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false
    },
    lastName: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('patient', 'caregiver', 'healthcare_provider', 'admin'),
      defaultValue: 'patient'
    },
    phone: {
      type: Encrypted(DataTypes.STRING, encryptionKey),
      allowNull: true,
      validate: {
        // Add custom validator to skip validation if empty
        isValidPhone(value) {
          if (value && value.length > 0 && (value.length < 10 || value.length > 20)) {
            throw new Error('Phone number must be between 10 and 20 characters');
          }
        }
      }
    },
    dateOfBirth: {
      type: DataTypes.TEXT,
      allowNull: true,
      set(value) {
        if (!value) { this.setDataValue('dateOfBirth', null); return; }
        this.setDataValue('dateOfBirth', encrypt(String(value)));
      },
      get() {
        const raw = this.getDataValue('dateOfBirth');
        return safeDecrypt(raw);
      }
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    refreshTokenHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        accessibility: {
          highContrast: false,
          largeText: false,
          voiceAlerts: true
        }
      }
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.TEXT,
      defaultValue: null,
      set(value) {
        if (!value) { this.setDataValue('emergencyContact', null); return; }
        const json = typeof value === 'string' ? value : JSON.stringify(value);
        this.setDataValue('emergencyContact', encrypt(json));
      },
      get() {
        const raw = this.getDataValue('emergencyContact');
        if (!raw) return { name: '', phone: '', relationship: '' };
        const decrypted = safeDecrypt(raw);
        try {
          return typeof decrypted === 'object' ? decrypted : JSON.parse(decrypted);
        } catch {
          // Legacy JSON stored directly by SQLite — return as-is
          return decrypted;
        }
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        // Convert empty strings to null for optional fields
        if (user.phone === '') user.phone = null;
        if (user.dateOfBirth === '') user.dateOfBirth = null;
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        // Convert empty strings to null for optional fields
        if (user.phone === '') user.phone = null;
        if (user.dateOfBirth === '') user.dateOfBirth = null;
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.refreshTokenHash;
    delete values.emailVerificationToken;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    return values;
  };

  // Static methods
  User.findByEmail = async function(email) {
    return await this.findOne({ where: { email } });
  };

  return User;
};
