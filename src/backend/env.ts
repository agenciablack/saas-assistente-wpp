export const env = (import.meta as unknown as {
  env: {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_N8N_WEBHOOK_URL?: string;
  };
}).env;
