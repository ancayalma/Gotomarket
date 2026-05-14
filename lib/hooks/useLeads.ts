import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

const QUERY_KEY = ['leads'];

/**
 * Fetch all leads for the current user
 */
export function useLeads(filters?: { accountId?: string; status?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*');

      if (filters?.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single lead by ID
 */
export function useLead(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

/**
 * Create a new lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLead: LeadInsert) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (data.account_id) {
        queryClient.invalidateQueries({ queryKey: ['leads', { accountId: data.account_id }] });
      }
    },
  });
}

/**
 * Update an existing lead
 */
export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: LeadUpdate) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

/**
 * Delete a lead
 */
export function useDeleteLead(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('leads')
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
