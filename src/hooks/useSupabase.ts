import { supabase } from '../backend/client';

/**
 * Hook para acessar o cliente Supabase tipado.
 */
export function useSupabase() {
  return supabase;
}
