import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

function stripViteClient(): Plugin {
  return {
    name: 'strip-vite-client',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<script type="module"[^>]*src="\/@vite\/client"[^>]*><\/script>\s*/,
          '',
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), ...(process.env.NO_HMR ? [stripViteClient()] : [])],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['fuoye-ballondor-web.outray.app'],
    hmr: process.env.NO_HMR ? false : true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
