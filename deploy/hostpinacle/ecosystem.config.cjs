/**
 * PM2 process manager — runs API + background worker.
 * Usage (from repo root on VPS):
 *   pm2 start deploy/hostpinacle/ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "waas-api",
      cwd: "/opt/whatsapp-saas/apps/api",
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: "/opt/whatsapp-saas/.env"
      }
    },
    {
      name: "waas-worker",
      cwd: "/opt/whatsapp-saas/apps/api",
      script: "dist/queue/workers/message.worker.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: "/opt/whatsapp-saas/.env"
      }
    }
  ]
};
