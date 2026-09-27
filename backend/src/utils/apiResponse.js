class ApiResponse {
  static success(res, data = null, statusCode = 200, meta = undefined) {
    const payload = {
      success: true
    };

    if (meta !== undefined) {
      Object.assign(payload, meta);
    }

    if (data !== null && data !== undefined) {
      payload.data = data;
    }

    return res.status(statusCode).json(payload);
  }

  static error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
    const payload = {
      success: false,
      error: {
        code,
        message
      }
    };

    if (details !== undefined && details !== null) {
      payload.error.details = details;
    }

    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
