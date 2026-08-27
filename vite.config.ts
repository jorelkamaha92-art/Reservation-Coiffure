import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.tiktok.com https://*.tiktokcdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tiktokcdn.com https://*.instagram.com https://*.cdninstagram.com https://*.fbcdn.net; media-src 'self' data: blob: https://*.supabase.co https://*.tiktokcdn.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com; frame-src 'self' https://www.tiktok.com https://www.instagram.com; object-src 'none'; base-uri 'self'; form-action 'self';",
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.tiktok.com https://*.tiktokcdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tiktokcdn.com https://*.instagram.com https://*.cdninstagram.com https://*.fbcdn.net; media-src 'self' data: blob: https://*.supabase.co https://*.tiktokcdn.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com; frame-src 'self' https://www.tiktok.com https://www.instagram.com; object-src 'none'; base-uri 'self'; form-action 'self';",
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
});
