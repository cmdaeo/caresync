const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DocumentMetadata = sequelize.define('DocumentMetadata', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    documentType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    generationTimestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordProtected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    signatureRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    includeCharts: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    accessCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastAccessed: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'document_metadata',
    timestamps: true,
    paranoid: false // This table should never be soft-deleted
  });

  return DocumentMetadata;
};