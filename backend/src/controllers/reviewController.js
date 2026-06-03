const { Review } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger'); // <-- THIS IS THE MISSING IMPORT

class ReviewController {
  async getReviews(req, res) {
    try {
      const reviews = await Review.findAll({
        where: { isApproved: true },
        order: [['createdAt', 'DESC']]
      });

      res.json(ApiResponse.success({ reviews }));
    } catch (error) {
      logger.error('Get reviews error:', error);
      throw error;
    }
  }

  async submitReview(req, res) {
    try {
      const { name, role, type, content, rating } = req.body;
      
      const review = await Review.create({
        name,
        role,
        type,
        rating: rating || 5,
        content
      });

      logger.info(`New review submitted by ${name} (${type})`);

      res.status(201).json(ApiResponse.success({ review }, 'Review submitted successfully', 201));
    } catch (error) {
      logger.error('Submit review error:', error);
      throw error;
    }
  }
}

module.exports = new ReviewController();