module.exports = {
  apps: [
    {
      name: "elite-setup-frontend",
      cwd: __dirname,
      script: "npm",
      args: "start -- --hostname 0.0.0.0 --port 3000",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "elite-setup-backend",
      cwd: `${__dirname}/server`,
      script: "npm",
      args: "start",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
