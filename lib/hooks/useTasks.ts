import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

const QUERY_KEY = ['tasks'];

/**
 * Fetch all tasks for the current user
 */
export function useTasks(filters?: { status?: string; priority?: string; accountId?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.accountId) {
        query = query.eq('account_id', filters.accountId);
      }

      const { data, error } = await query.order('due_date', { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
    staleTime: 3 * 60 * 1000, // Tasks más fresh: 3 minutos
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Task;
    },
    enabled: !!id,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTask: TaskInsert) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: TaskUpdate) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tasks')
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
