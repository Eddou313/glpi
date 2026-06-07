import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/glpi-api': {
        target: process.env.VITE_SERVER_DOMAINE || 'http://glpi.local',
        changeOrigin: true,               
        // rewrite: (path) => path.replace(/^\/glpi-api/, '/api'),
        rewrite: (path) => path.replace(/^\/glpi-api/, '/api.php')
        // Si votre GLPI est en HTTPS avec un cert auto-signé, décommentez :
        // secure: false,
      },
    }
  }
});
