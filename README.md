# Baidehi Energy — Node/Express

This is the Node.js/Express implementation of the Baidehi Energy website. Its templates, CSS, static assets, and media are retained to preserve the current design.

## Start locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`, set a strong `SESSION_SECRET`, and generate an `ADMIN_PASSWORD_HASH`.
3. Run `npm install`.
4. Run `npm run dev`, then open `http://localhost:3000`.

The editor area is at `/naren`. It requires `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH`.

To email new contact-form enquiries, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL_FROM`, and `CONTACT_EMAIL_TO` in `.env`. See [DEPLOYMENT.md](DEPLOYMENT.md) for the settings and TLS guidance.

## Preserved source folders

- `templates/` is the public template source and is rendered by Nunjucks under Express.
- `static/` remains available at `/static/`.
- `media/` remains available at `/media/` and receives new admin uploads.
- `data/baidehi.sqlite3` is the application database.

## Validation

Run `npm run check` for JavaScript syntax checks and `npm test` for public-route, CSRF, and contact-form smoke tests. Before deployment, set `NODE_ENV=production`, use HTTPS, and set production-only secrets. See [DEPLOYMENT.md](DEPLOYMENT.md) for the required production configuration and backup guidance.
