/** PM2 process file for Hostinger / VPS Node hosting */
module.exports = {
  apps: [
    {
      name: 'astor-electronics',
      script: '.output/server/index.mjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      max_memory_restart: '512M',
      watch: false,
    },
  ],
}
