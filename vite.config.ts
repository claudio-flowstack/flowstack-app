import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import { babelDataLocPlugin } from './vite-plugins/babel-data-loc'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ...(process.env.NODE_ENV !== 'production' ? [babelDataLocPlugin] : []),
        ],
      },
    }),
    tailwindcss(),
    svgr(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://127.0.0.1:3002',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
