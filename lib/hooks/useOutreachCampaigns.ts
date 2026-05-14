import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type OutreachCampaign = Database['public']['Tables']['outreach_campaigns']['Row'];
type OutreachCampaignInsert = Database['public']['Tables']['outreach_campaigns']['Insert'];
type OutreachCampaignUpdate = Database['public']['Tables']['outreach_campaigns']['Update'];

const QUERY_KEY = ['outreach_campaigns'];

/**
 * Fetch all outreach campaigns for the current user
 */
export function useOutreachCampaigns(filters?: { status?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('outreach_campaigns')
        .select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as OutreachCampaign[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single campaign by ID
 */
export function useOutreachCampaign(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as OutreachCampaign;
    },
    enabled: !!id,
  });
}

/**
 * Create a new outreach campaign
 */
export function useCreateOutreachCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCampaign: OutreachCampaignInsert) => {
      const { data, error } = await supabase
        .from('outreach_campaigns')
        .insert([newCampaign])
        .select()
        .single();

      if (error) throw error;
      return data as OutreachCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Update an existing campaign
 */
export function useUpdateOutreachCampaign(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: OutreachCampaignUpdate) => {
      const { data, error } = await supabase
        .from('outreach_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as OutreachCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

/**
 * Delete a campaign
 */
export function useDeleteOutreachCampaign(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('outreach_campaigns')
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
