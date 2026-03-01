import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateItineraryDayRequest, UpdateItineraryDayRequest, CreateItineraryStageRequest, UpdateItineraryStageRequest } from "@shared/schema";

export function useItinerary(groupId: number) {
  return useQuery({
    queryKey: [api.itinerary.list.path, groupId],
    queryFn: async () => {
      const url = buildUrl(api.itinerary.list.path, { groupId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch itinerary");
      return api.itinerary.list.responses[200].parse(await res.json());
    },
    enabled: !!groupId,
  });
}

export function useCreateItineraryDay(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateItineraryDayRequest, 'groupId'>) => {
      const url = buildUrl(api.itinerary.create.path, { groupId });
      const validated = api.itinerary.create.input.parse(data);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add itinerary day");
      return api.itinerary.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, groupId] }),
  });
}

export function useUpdateItineraryDay(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateItineraryDayRequest }) => {
      const url = buildUrl(api.itinerary.update.path, { id });
      const validated = api.itinerary.update.input.parse(data);
      
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update day");
      return api.itinerary.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, groupId] }),
  });
}

export function useDeleteItineraryDay(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.itinerary.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete day");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, groupId] }),
  });
}

export function useGroupStages(groupId: number) {
  return useQuery({
    queryKey: [api.stages.listByGroup.path, groupId],
    queryFn: async () => {
      const url = buildUrl(api.stages.listByGroup.path, { groupId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch group stages");
      return api.stages.listByGroup.responses[200].parse(await res.json());
    },
    enabled: !!groupId,
  });
}

// Stages
export function useStages(dayId: number) {
  return useQuery({
    queryKey: [api.stages.list.path, dayId],
    queryFn: async () => {
      const url = buildUrl(api.stages.list.path, { dayId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stages");
      return api.stages.list.responses[200].parse(await res.json());
    },
    enabled: !!dayId,
  });
}

export function useCreateStage(dayId: number, groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateItineraryStageRequest, 'dayId'>) => {
      const url = buildUrl(api.stages.create.path, { dayId });
      const validated = api.stages.create.input.parse(data);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add stage");
      return api.stages.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stages.list.path, dayId] });
      queryClient.invalidateQueries({ queryKey: [api.stages.listByGroup.path, groupId] });
      queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, groupId] });
    },
  });
}

export function useUpdateStage(dayId: number, groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateItineraryStageRequest }) => {
      const url = buildUrl(api.stages.update.path, { id });
      const validated = api.stages.update.input.parse(data);
      
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return api.stages.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stages.list.path, dayId] });
      queryClient.invalidateQueries({ queryKey: [api.stages.listByGroup.path, groupId] });
      queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, groupId] });
    },
  });
}

export function useDeleteStage(dayId: number, groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.stages.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete stage");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stages.list.path, dayId] });
      queryClient.invalidateQueries({ queryKey: [api.stages.listByGroup.path, groupId] });
      queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, groupId] });
    },
  });
}
