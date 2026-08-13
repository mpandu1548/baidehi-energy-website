const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isMultipartForm(req) {
  return typeof req.is === 'function' && req.is('multipart/form-data');
}

function rejectInvalidToken(next) {
  const error = new Error('Invalid form security token. Please refresh the page and try again.');
  error.status = 403;
  return next(error);
}

function submittedToken(req) {
  return req.body?._csrf || req.get?.('x-csrf-token');
}

function tokenMatches(req) {
  const token = submittedToken(req);
  const sessionToken = req.session?.csrfToken;
  if (typeof token !== 'string' || typeof sessionToken !== 'string') return false;
  const tokenBuffer = Buffer.from(token);
  const sessionTokenBuffer = Buffer.from(sessionToken);
  return tokenBuffer.length === sessionTokenBuffer.length
    && crypto.timingSafeEqual(tokenBuffer, sessionTokenBuffer);
}

function csrfProtection(req, res, next) {
  if (!req.session) return next(new Error('Sessions must be configured before CSRF protection.'));
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;

  // Multer parses multipart request bodies. Defer validation until it has run so
  // the hidden _csrf field is available for image-upload forms.
  if (SAFE_METHODS.has(req.method) || isMultipartForm(req) || tokenMatches(req)) return next();
  return rejectInvalidToken(next);
}

function validateMultipartCsrf(req, res, next) {
  if (tokenMatches(req)) return next();
  return rejectInvalidToken(next);
}

module.exports = { csrfProtection, validateMultipartCsrf };
