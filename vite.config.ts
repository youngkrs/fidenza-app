/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Serves POST /api/curate-seed during `vite dev` by reusing the same server
 * logic the production serverless function uses. Lets the "Generate via Claude"
 * feature work locally when ANTHROPIC_API_KEY is set (in the shell or a .env
 * file). Without a key it returns 500 and the UI falls back to a random seed.
 */
function curateSeedDevApi(apiKey: string | undefined): Plugin {
  return {
    name: 'curate-seed-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/curate-seed', (req, res) => {
        void (async () => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }
          try {
            const { curateSeed } = await import('./api/_curate.js');
            const result = await curateSeed(apiKey);
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            );
          }
        })();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), curateSeedDevApi(env.ANTHROPIC_API_KEY)],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
