/**
 * Settings HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to Settings service operations
 */

import type { Express } from "express";
import type { ISettings } from "../Settings.ts";

export function registerSettingsRoutes(app: Express, settingsService: ISettings) {
  // GET /settings - Retrieve current settings
  app.get("/settings", async (_req, res) => {
    try {
      const settings = await settingsService.getSettings();
      res.json(settings);
    } catch (_error) {
      res.status(500).json({ error: "Failed to retrieve settings" });
    }
  });

  // PUT /settings - Update settings
  app.put("/settings", async (req, res) => {
    try {
      const result = await settingsService.updateSettings(req.body);
      res.json({
        success: result.success,
        message: "Settings updated (mock - not persisted)",
        settings: result.settings,
      });
    } catch (_error) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });
}
