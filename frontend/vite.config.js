import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // Prevent duplicate module instances that can break React Three Fiber context.
  resolve: {
    alias: {
      '@clerk/clerk-react': new URL('./src/auth/clerkAdapter.jsx', import.meta.url).pathname
    },
    dedupe: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei'
    ]
  },
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei'
    ]
  }
})
