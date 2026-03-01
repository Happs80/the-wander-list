import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MasterItem } from "@shared/schema";

export function useMasterItems() {
  return useQuery<MasterItem[]>({
    queryKey: ['/api/master-items'],
  });
}

export function useCreateMasterItem() {
  return useMutation({
    mutationFn: async (data: Omit<MasterItem, 'id' | 'userId'>) => {
      const response = await apiRequest('POST', '/api/master-items', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-items'] });
    },
  });
}

export function useUpdateMasterItem() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Omit<MasterItem, 'id' | 'userId'>> }) => {
      const response = await apiRequest('PATCH', `/api/master-items/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-items'] });
    },
  });
}

export function useDeleteMasterItem() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/master-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-items'] });
    },
  });
}

export function useSyncFromTrip() {
  return useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest('POST', '/api/master-items/sync-from-trip', { groupId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-items'] });
    },
  });
}

export function useSyncToTrip() {
  return useMutation({
    mutationFn: async ({ groupId, category }: { groupId: number; category?: 'gear' | 'clothing' }) => {
      const response = await apiRequest('POST', '/api/master-items/sync-to-trip', { groupId, category });
      return response.json();
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'items'] });
    },
  });
}

export function useAddFromCloset() {
  return useMutation({
    mutationFn: async ({ groupId, masterItemIds }: { groupId: number; masterItemIds: number[] }) => {
      const response = await apiRequest('POST', '/api/master-items/add-to-trip', { groupId, masterItemIds });
      return response.json();
    },
    onSuccess: (_, { groupId }) => {
      // Match the query key used by useItems: [api.items.list.path, groupId]
      queryClient.invalidateQueries({ queryKey: ['/api/groups/:groupId/items', groupId] });
    },
  });
}
