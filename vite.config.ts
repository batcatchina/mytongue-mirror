import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/mytongue-mirror/' : '/',
  plugins: [
    react(),
    // 修复微信WebView兼容性：去掉type="module"
    {
      name: 'fix-wechat-compat',
      transformIndexHtml(html) {
        return html.replace(/type="module"\s+crossorigin/g, 'defer');
      },
    },
  ],
  build: {
    // 兼容微信内置浏览器（基于Chrome 62+）
    target: ['es2015', 'safari11'],
    // 不用ES Module格式，用IIFE兼容旧WebView
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
