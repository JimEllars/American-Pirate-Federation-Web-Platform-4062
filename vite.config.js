import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const envAuditPlugin = () => {
  return {
    name: 'env-audit',
    configResolved(config) {
      const requiredEnv = ['VITE_THIRDWEB_CLIENT_ID'];
      requiredEnv.forEach((key) => {
        if (!config.env[key]) {
          console.warn(`\x1b[33m[ WARN: MISSING CRITICAL ENVIRONMENT VARIABLE ] ${key} is not defined.\x1b[0m`);
        }
      });
    }
  };
};

export default defineConfig({
  plugins: [
    envAuditPlugin(),
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream', 'http', 'https', 'zlib'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    historyApiFallback: true,
  },
  esbuild: {
    drop: ['console'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'zustand'],
          web3: ['thirdweb', 'thirdweb/react', 'ethers']
        }
      }
    }
  },
});
