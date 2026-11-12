import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // The dev server is reached from a phone on the same network. The mDNS
    // name of this machine stays the same when the ip address changes.
    allowedHosts: ['.local']
  }
});
