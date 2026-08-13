# Production deployment

The app needs Node.js 20+ and a persistent writable filesystem for the SQLite database and `media/` uploads. For an initial single-server deployment, use a service such as a VPS, Render disk, Railway volume, or similar persistent-volume host.

## Required configuration

Set the following environment variables in the hosting control panel, rather than committing a `.env` file:

```text
NODE_ENV=production
PORT=3000
DATABASE_PATH=/var/lib/baidehi/baidehi.sqlite3
SESSION_SECRET=<a-long-random-secret>
ADMIN_USERNAME=<editor-login-name>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
UPLOAD_MAX_FILE_SIZE=5242880
```

Generate the password hash locally:

```bash
node -e "console.log(require('bcryptjs').hashSync('choose-a-strong-password', 12))"
```

## First deployment

```bash
npm ci --omit=dev
npm start
```

Copy the existing `media/` directory to the host before first start. The Node application creates its database at `DATABASE_PATH` when it starts.

## Docker deployment

Build the image from the project root:

```bash
docker build -t baidehi-energy .
```

Run it with persistent volumes for both the database and uploaded images:

```bash
docker run -d --name baidehi-energy --restart unless-stopped \
  --env-file .env \
  -e DATABASE_PATH=/app/data/baidehi.sqlite3 \
  -p 3000:3000 \
  -v baidehi_data:/app/data \
  -v baidehi_media:/app/media \
  baidehi-energy
```

The image copies the existing project images into an empty media volume on its first boot. Use `GET /healthz` for container, load-balancer, or uptime-monitor health checks.

## Reverse proxy and backups

Place the app behind HTTPS (for example, Nginx or the hosting provider's proxy). In production Express trusts one proxy hop and sends secure session cookies.

Back up both the SQLite file and `media/` directory together. Do this before deploys and on a schedule; they contain all editor-managed content and uploads. For multi-instance or autoscaling hosting, move the database to PostgreSQL and uploads to object storage before scaling beyond one application process.
