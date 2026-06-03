const { DataTypes } = require('sequelize'); // <-- THIS IS THE MISSING IMPORT

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('clinical', 'patient', 'caregiver'),
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: { min: 1, max: 5 }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true
  });

  return Review;
};