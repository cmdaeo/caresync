class ApiResponse {
  constructor(success, data = null, message = null, statusCode = 200) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.statusCode = statusCode;
  }

  static success(data = null, message = null, statusCode = 200) {
    return new ApiResponse(true, data, message, statusCode);
  }

  static error(message = null, statusCode = 500) {
    return new ApiResponse(false, null, message, statusCode);
  }

  toJSON() {
    const response = {
      success: this.success,
      timestamp: this.timestamp
    };

    if (this.data !== null) {
      response.data = this.data;
    }

    if (this.message !== null) {
      response.message = this.message;
    }

    return response;
  }
}

module.exports = ApiResponse;