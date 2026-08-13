require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nunjucks = require('nunjucks');
const { csrfProtection } = require('./middleware/csrf');
const { sequelize } = require('./models');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const viewsPath = path.join(process.cwd(), 'templates');
const env = nunjucks.configure([viewsPath, path.join(process.cwd(), 'views')], { autoescape: true, express: app, noCache: process.env.NODE_ENV === 'development' });
env.addFilter('date', (value, format) => {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return '';
  const month = new Intl.DateTimeFormat('en-US', { month: format.includes('M') ? (format.includes('F') ? 'long' : 'short') : undefined }).format(date);
  const day = String(date.getUTCDate()).padStart(format.includes('d') && !format.includes('F') ? 2 : 1, '0');
  return format === 'd M Y' ? `${day} ${month} ${date.getUTCFullYear()}` : `${month} ${day}, ${date.getUTCFullYear()}`;
});
env.addFilter('truncatewords', (value, count) => String(value || '').split(/\s+/).slice(0, Number(count)).join(' '));

app.set('view engine', 'html');
app.set('views', viewsPath);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(process.cwd(), 'static')));
app.use('/static', express.static(path.join(process.cwd(), 'static')));
app.use('/media', express.static(path.join(process.cwd(), 'media')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    // Keeps session-backed forms working over local HTTP while retaining Secure
    // cookies whenever the request is HTTPS (including behind a trusted proxy).
    secure: 'auto',
  },
}));
app.use(csrfProtection);
// Forms contain a session-bound CSRF token. Never allow a browser or proxy to
// reuse an old rendered login/admin form after the session has changed.
app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use(flash());
app.use((req, res, next) => { res.locals.isAdmin = Boolean(req.session.isAdmin); res.locals.messages = { error: req.flash('error'), success: req.flash('success') }; next(); });
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/contact/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use((req, res) => res.status(404).send('Page not found'));
app.use((error, req, res, next) => { console.error(error); res.status(error.status || 500).send(error.status ? error.message : 'An unexpected error occurred.'); });

async function initialiseDatabase() {
  await sequelize.sync();
  // `sync()` creates new tables but does not add fields to an existing SQLite
  // table. Keep this small, backwards-compatible migration here so deployed
  // sites gain the news document field without a manual database reset.
  const columns = await sequelize.getQueryInterface().describeTable('news_notices');
  if (!columns.attachment) {
    await sequelize.getQueryInterface().addColumn('news_notices', 'attachment', {
      type: require('sequelize').DataTypes.STRING(255),
      allowNull: true,
    });
  }
}
module.exports = { app, initialiseDatabase };
