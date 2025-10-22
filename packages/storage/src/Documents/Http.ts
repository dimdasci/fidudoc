/**
 * Documents HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to Documents service operations
 */

import type { Express } from "express";
import type { IDocuments } from "../Documents.ts";

export function registerDocumentsRoutes(app: Express, documentsService: IDocuments) {
  // GET /documents - List and filter documents
  app.get("/documents", async (req, res) => {
    try {
      const result = await documentsService.listDocuments({
        status: req.query.status as any,
        client_id: req.query.client_id as string,
        type: req.query.type as any,
        validation_status: req.query.validation_status as any,
        period: req.query.period as string,
        from: req.query.from as string,
        to: req.query.to as string,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to list documents" });
    }
  });

  // GET /documents/:id - Get single document metadata
  app.get("/documents/:id", async (req, res) => {
    try {
      const document = await documentsService.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve document" });
    }
  });

  // GET /documents/:id/preview - Get document preview/download
  app.get("/documents/:id/preview", async (req, res) => {
    try {
      const preview = await documentsService.getDocumentPreview(req.params.id);
      if (!preview) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(preview);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve preview" });
    }
  });

  // GET /documents/:id/extracted-data - Get extracted structured data
  app.get("/documents/:id/extracted-data", async (req, res) => {
    try {
      const data = await documentsService.getExtractedData(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve extracted data" });
    }
  });

  // POST /documents/approve - Approve documents
  app.post("/documents/approve", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          error: "Invalid request: ids must be a non-empty array",
        });
      }

      const result = await documentsService.approveDocuments(ids);
      res.json({
        success: result.success,
        message: `Approved ${ids.length} document(s)`,
        approvedIds: result.approvedIds,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to approve documents" });
    }
  });

  // POST /documents/reject - Reject documents
  app.post("/documents/reject", async (req, res) => {
    try {
      const { ids, reason } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          error: "Invalid request: ids must be a non-empty array",
        });
      }

      const result = await documentsService.rejectDocuments(ids, reason);
      res.json({
        success: result.success,
        message: `Rejected ${ids.length} document(s)`,
        rejectedIds: result.rejectedIds,
        reason: reason || "No reason provided",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to reject documents" });
    }
  });
}
