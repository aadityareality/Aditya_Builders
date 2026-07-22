/**
 * catchAsync — Async error wrapper for Express controllers.
 *
 * Eliminates repetitive try/catch blocks in every controller function.
 * Any thrown error or rejected Promise is automatically forwarded to
 * Express's next(err), which routes it to the globalErrorHandler.
 *
 * Usage:
 *   export const myController = catchAsync(async (req, res, next) => {
 *     // ... your logic, no try/catch needed
 *   });
 *
 * @param {Function} fn - async controller function (req, res, next)
 * @returns {Function} Express middleware with error forwarding
 */
const catchAsync = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
