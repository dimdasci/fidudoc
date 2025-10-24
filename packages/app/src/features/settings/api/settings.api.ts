import type { Settings } from "@shared/services/api";
import { fetchSettings, updateSettings } from "@shared/services/api";

export type { Settings };

export function getSettings() {
  return fetchSettings();
}

export function putSettings(settings: Partial<Settings>) {
  return updateSettings(settings);
}
