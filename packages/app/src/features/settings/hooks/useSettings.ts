import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, putSettings, type Settings } from "@features/settings/api/settings.api";

const SETTINGS_QUERY_KEY = ["settings"];

export function useSettingsQuery() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: getSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: putSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}

export type SettingsData = Settings;
