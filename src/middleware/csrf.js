const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function secretFor(req) {
  return req.app?.get('session secret') || process.env.SESSION_SECRET || 'development-only-change-this';
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createToken(secret) {
  const payload = encode(JSON.stringify({
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(32).toString('hex'),
  }));
  return `${payload}.${signature(payload, secret)}`;
}

function isSignedTokenValid(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;

  const expected = Buffer.from(signature(parts[0], secret));
  const actual = Buffer.from(parts[1]);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return false;

  try {
    const { issuedAt } = JSON.parse(decode(parts[0]));
    const age = Date.now() - issuedAt;
    return Number.isFinite(issuedAt) && age >= 0 && age <= TOKEN_MAX_AGE_MS;
  } catch (error) {
    return false;
  }
}

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
  return typeof token === 'string' && isSignedTokenValid(token, secretFor(req));
}

function csrfProtection(req, res, next) {
  if (!req.session) return next(new Error('Sessions must be configured before CSRF protection.'));
  if (!req.session.csrfToken || !isSignedTokenValid(req.session.csrfToken, secretFor(req))) {
    req.session.csrfToken = createToken(secretFor(req));
  }
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
