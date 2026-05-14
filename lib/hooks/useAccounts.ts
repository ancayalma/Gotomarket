import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

const QUERY_KEY = ['accounts'];

/**
 * Fetch all accounts for the current user
 */
export function useAccounts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Account[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single account by ID
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Account;
    },
    enabled: !!id,
  });
}

/**
 * Create a new account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newAccount: AccountInsert) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert([newAccount])
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Update an existing account
 */
export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: AccountUpdate) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

/**
 * Delete an account
 */
export function useDeleteAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.removeQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}
