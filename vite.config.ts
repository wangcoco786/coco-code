import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
 plugins: [react()],
 resolve: {
 alias: {
 '@': path.resolve(__dirname, './src'),
 },
 },
 server: {
 proxy: {
 '/api': {
 target: 'http://localhost:3000',
 changeOrigin: true,
 },
 },
 },
 build: {
 rollupOptions: {
 output: {
 entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
 chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
 assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
 },
 },
 },
 test: {
 globals: true,
 environment: 'jsdom',
 setupFiles: ['./src/test/setup.ts'],
 },
})