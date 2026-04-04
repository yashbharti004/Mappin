'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLocations, createLocation } from '@/lib/api';

export function useLocations(bounds, type) {
  return useQuery({
    queryKey: ['locations', bounds, type],
    queryFn: () => fetchLocations(bounds, type),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
