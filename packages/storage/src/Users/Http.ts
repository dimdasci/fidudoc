/**
 * Users HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to Users service operations
 */

import type { Express } from "express";
import type { IUsers } from "../Users.ts";

export function registerUsersRoutes(app: Express, usersService: IUsers) {
  // GET /users - List all users
  app.get("/users", async (_req, res) => {
    try {
      const result = await usersService.listUsers();
      res.json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to list users" });
    }
  });

  // POST /users - Create a new user
  app.post("/users", async (req, res) => {
    try {
      const { email, name, role } = req.body;

      if (!email || !name || !role) {
        return res.status(400).json({
          error: "Invalid request: email, name, and role are required",
        });
      }

      const result = await usersService.createUser({ email, name, role });
      res.status(201).json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // PUT /users/:id - Update a user
  app.put("/users/:id", async (req, res) => {
    try {
      const { name, role, isActive } = req.body;

      const result = await usersService.updateUser(req.params.id, {
        name,
        role,
        isActive,
      });
      res.json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // GET /audit-log - Get audit trail
  app.get("/audit-log", async (req, res) => {
    try {
      const result = await usersService.getAuditLog({
        userId: req.query.userId as string,
        action: req.query.action as string,
        resourceType: req.query.resourceType as string,
      });
      res.json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to retrieve audit log" });
    }
  });
}
