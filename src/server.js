const { app, initialiseDatabase } = require('./app');
const port = Number(process.env.PORT || 3000);

initialiseDatabase().then(() => {
  const server = app.listen(port, () => console.log(`Baidehi Energy is running at http://localhost:${port}`));
  const shutdown = (signal) => server.close(() => {
    console.log(`${signal} received; server stopped.`);
    process.exit(0);
  });
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}).catch((error) => { console.error('Database startup failed:', error); process.exit(1); });
