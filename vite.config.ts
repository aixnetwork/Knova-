
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the browser so the Google GenAI SDK works seamlessly
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Disable sourcemaps in production to save bandwidth
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React (changes infrequently)
            vendor: ['react', 'react-dom'],
            // Large Visualization Libraries (heavy, cache these)
            charts: ['recharts', 'd3'],
            // AI SDK (heavy, cache this)
            ai: ['@google/genai'],
            // Icons
            icons: ['lucide-react']
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: true,
      hmr: false,
      watch: {
        usePolling: true,
      }
    },
    preview: {
      host: '0.0.0.0',
      port: 8080
    }
  }
})
