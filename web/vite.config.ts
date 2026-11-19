import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

function preloadJakartaFontPlugin(): Plugin {
  return {
    name: 'preload-plus-jakarta-sans',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;
      const assetKey = Object.keys(ctx.bundle).find((key) =>
        /plus-jakarta-sans-latin-wght-normal.*\.woff2$/.test(key),
      );
      if (!assetKey) return html;
      return html.replace(
        '/assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2',
        `/${assetKey}`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadJakartaFontPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/functions', 'firebase/storage'],
          firestore: ['firebase/firestore'],
          motion: ['motion'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
