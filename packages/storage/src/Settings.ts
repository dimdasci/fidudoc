/**
 * Settings Service - Business capability for managing system settings
 *
 * This service orchestrates system settings operations and is exposed at the
 * top level to immediately communicate this business capability.
 */

import type { Settings } from "./Domain/types.ts";
import { generateMockSettings } from "./Domain/mocks.ts";

export interface ISettings {
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Settings) => Promise<{ success: boolean; settings: Settings }>;
}

/**
 * In-memory implementation of Settings service (mock)
 * In production, this would interact with a database via SettingsRepo
 */
export function createSettingsService(): ISettings {
  let currentSettings = generateMockSettings();

  return {
    async getSettings() {
      return currentSettings;
    },
    async updateSettings(settings: Settings) {
      currentSettings = settings;
      return { success: true, settings };
    },
  };
}
