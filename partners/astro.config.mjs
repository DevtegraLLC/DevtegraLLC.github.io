import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The FitCreature partner portal (F91). A static, client-side app: every
// data operation is a Supabase RPC / edge-function call as the signed-in
// partner (or admin), so there is no server here at all.
export default defineConfig({
  site: 'https://partners.devtegra.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
