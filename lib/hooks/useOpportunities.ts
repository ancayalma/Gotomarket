import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Opportunity = Database['public']['Tables']['opportunities']['Row'];
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert'];
type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update'];

const QUERY_KEY = ['opportunities'];

/**
 * Fetch all opportunities, optionally filtered by account or stage
 */
export function useOpportunities(filters?: { accountId?: string; stage?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select('*');

      if (filters?.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }

      const { data, error } = await query.order('close_date', { ascending: true });
      if (error) throw error;
      return data as Opportunity[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single opportunity by ID
 */
export function useOpportunity(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Opportunity;
    },
    enabled: !!id,
  });
}

/**
 * Create a new opportunity
 */
export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOpp: OpportunityInsert) => {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([newOpp])
        .select()
        .single();

      if (error) throw error;
      return data as Opportunity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (data.account_id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, { accountId: data.account_id }] });
      }
    },
  });
}

/**
 * Update an existing opportunity
 */
export function useUpdateOpportunity(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: OpportunityUpdate) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Opportunity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

/**
 * Delete an opportunity
 */
export function useDeleteOpportunity(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('opportunities')
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
