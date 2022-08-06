class NetworkError extends Error {
  constructor(message, httpCode) {
    super(message);
    this.httpCode = httpCode;
  }
}

module.exports = NetworkError
