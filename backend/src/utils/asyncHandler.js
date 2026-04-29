// Wraps an async route handler so any thrown / rejected error
// is forwarded to the central Express error middleware via next().
// Saves us writing try/catch in every controller.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
