import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Contact = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

const QUERY_KEY = ['contacts'];

/**
 * Fetch all contacts, optionally filtered by account
 */
export function useContacts(accountId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, accountId],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*');

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query.order('last_name', { ascending: true });
      if (error) throw error;
      return data as Contact[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single contact by ID
 */
export function useContact(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id,
  });
}

/**
 * Create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newContact: ContactInsert) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert([newContact])
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (data.account_id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.account_id] });
      }
    },
  });
}

/**
 * Update an existing contact
 */
export function useUpdateContact(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ContactUpdate) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

/**
 * Delete a contact
 */
export function useDeleteContact(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('contacts')
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
