import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const glpiTarget = env.VITE_SERVER_DOMAINE || 'http://glpi.localhost'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
        '/glpi-api': {
          target: glpiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/glpi-api/, '/api.php'),
          // Si votre GLPI est en HTTPS avec un cert auto-signé, décommentez :
          // secure: false,
        },
      },
    },
  }
});
