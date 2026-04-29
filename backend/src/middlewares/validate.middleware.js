// Runs an express-validator chain and returns 400 with a clean
// validation error envelope when any field fails.

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const message = result
    .array()
    .map((e) => `${e.path}: ${e.msg}`)
    .join(', ');
  return next(new AppError(message, 400, 'VALIDATION_ERROR'));
}

module.exports = { validate };
