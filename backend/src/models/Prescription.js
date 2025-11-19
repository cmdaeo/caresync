const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  prescriptionNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prescriberName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prescriberLicense: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prescriberPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prescriberAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pharmacyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pharmacyAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pharmacyPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'filled', 'cancelled', 'pending'),
    defaultValue: 'active'
  },
  refillsAllowed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  refillsUsed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  medications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icd10Code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pdfOriginalName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  extractedData: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
  },
  needsReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'prescriptions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['issueDate']
    },
    {
      fields: ['expiryDate']
    }
  ]
});

// Instance methods
Prescription.prototype.isExpired = function() {
  return new Date() > this.expiryDate;
};

Prescription.prototype.getRemainingRefills = function() {
  return Math.max(0, this.refillsAllowed - this.refillsUsed);
};

Prescription.prototype.canBeRefilled = function() {
  return this.status === 'active' && 
         !this.isExpired() && 
         this.getRemainingRefills() > 0;
};

Prescription.prototype.getActiveMedications = function() {
  return this.medications.filter(med => med.isActive !== false);
};

module.exports = Prescription;