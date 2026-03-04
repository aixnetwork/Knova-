
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory (empty prefix = load all vars)
  const env = loadEnv(mode, (process as any).cwd(), '');
  // Expose Gemini key to client: support both GEMINI_API_KEY and VITE_GEMINI_API_KEY in .env.local
  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  return {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify(env),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
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
