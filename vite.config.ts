import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite prints "ready" before Nitro's dev worker finishes importing SSR modules.
 * Early document requests then fail with NitroViteError (503 unavailable).
 */
function nitroDevWarmup(): Plugin {
  return {
    name: 'astor:nitro-dev-warmup',
    enforce: 'pre',
    apply: 'serve',
    configureServer(server) {
      let nitroReady = false
      let warmupPromise: Promise<void> | undefined

      const runWarmup = () => {
        warmupPromise ??= (async () => {
          for (let i = 0; i < 120 && !server.environments.nitro; i++) {
            await new Promise((resolve) => setTimeout(resolve, 250))
          }

          const nitroEnv = server.environments.nitro
          if (!nitroEnv) {
            nitroReady = true
            return
          }

          for (let attempt = 0; attempt < 120; attempt++) {
            try {
              const response = await nitroEnv.dispatchFetch(
                new Request('http://localhost/', {
                  headers: { accept: 'text/html' },
                }),
              )
              const body = await response.clone().text()
              if (
                !body.includes('NitroViteError') &&
                !body.includes('Vite environment "nitro" is unavailable')
              ) {
                break
              }
            } catch {
              // retry until Nitro's dev worker finishes booting
            }
            await new Promise((resolve) => setTimeout(resolve, 500))
          }

          nitroReady = true
        })()
        return warmupPromise
      }

      void runWarmup()

      server.middlewares.use(async (req, _res, next) => {
        if (nitroReady) return next()
        const url = req.url ?? ''
        if (url.startsWith('/@') || url.startsWith('/__')) return next()
        await runWarmup()
        next()
      })
    },
  }
}

/**
 * DEPLOY_TARGET controls the production adapter:
 * - `node`    → Hostinger / VPS / any Node host (Nitro node-server → .output/)
 * - `netlify` → Netlify (official plugin → dist/client + serverless)
 */
const deployTarget = process.env.DEPLOY_TARGET ?? 'node'
const isNetlify = deployTarget === 'netlify'

export default defineConfig({
  esbuild: {
    jsxDev: false,
  },
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
    viteReact({
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
    ...(isNetlify
      ? [netlify()]
      : [
          nitro({
            preset: 'node-server',
          }),
          nitroDevWarmup(),
        ]),
  ],
})
