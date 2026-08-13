const bcrypt = require('bcryptjs');

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

async function login(req, res) {
  const { username, password } = req.body;
  const usernameMatches = username && username === process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordMatches = passwordHash && password ? await bcrypt.compare(password, passwordHash) : false;
  if (!usernameMatches || !passwordMatches) {
    req.flash('error', 'Invalid username or password.');
    return res.redirect('/admin/login');
  }
  req.session.isAdmin = true;
  return res.redirect('/admin');
}

module.exports = { requireAdmin, login };
