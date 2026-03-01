import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nickname?: string; mobileNumber?: string; unitSystem?: string; dateFormat?: string }) => {
      const res = await apiRequest("PATCH", api.auth.updateProfile.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  });
}
