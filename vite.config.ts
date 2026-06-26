import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * DEPLOY_TARGET controls the production adapter:
 * - `node`    → Hostinger / VPS / any Node host (Nitro node-server → .output/)
 * - `netlify` → Netlify (official plugin → dist/client + serverless)
 */
const deployTarget = process.env.DEPLOY_TARGET ?? 'node'
const isNetlify = deployTarget === 'netlify'

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(),
    viteReact(),
    tailwindcss(),
    ...(isNetlify
      ? [netlify()]
      : [
          nitro({
            preset: 'node-server',
          }),
        ]),
  ],
})
