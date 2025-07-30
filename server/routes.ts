import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQueueEntrySchema, insertDropSchema, insertSettingsSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Direct download route for Vercel deployment package
  app.get("/download-vercel", (req, res) => {
    const filePath = "./locks-sold-vercel.zip";
    res.download(filePath, "locks-sold-vercel.zip", (err) => {
      if (err) {
        res.status(404).send("File not found");
      }
    });
  });

  // Helper function to mask email addresses for privacy
  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.slice(0, 2)}***@${domain}`;
  };

  // Get queue stats
  app.get("/api/queue/stats", async (req, res) => {
    try {
      const totalSize = await storage.getTotalQueueSize();
      const entries = await storage.getAllQueueEntries();
      
      // Always show consistent queue size with mock data base
      const mockBaseSize = 283;
      const consistentTotal = Math.max(mockBaseSize, totalSize);
      
      // Create a mix of mock and real entries for display
      const mockEntries = [
        { position: 1, email: "alex***@gmail.com", joinedAt: new Date(Date.now() - 120 * 60000) },
        { position: 2, email: "jordan***@yahoo.com", joinedAt: new Date(Date.now() - 110 * 60000) },
        { position: 3, email: "sam***@hotmail.com", joinedAt: new Date(Date.now() - 100 * 60000) },
        { position: 4, email: "casey***@gmail.com", joinedAt: new Date(Date.now() - 90 * 60000) },
        { position: 5, email: "taylor***@outlook.com", joinedAt: new Date(Date.now() - 85 * 60000) },
        { position: 6, email: "morgan***@gmail.com", joinedAt: new Date(Date.now() - 80 * 60000) },
        { position: 7, email: "riley***@yahoo.com", joinedAt: new Date(Date.now() - 75 * 60000) },
        { position: 8, email: "blake***@icloud.com", joinedAt: new Date(Date.now() - 70 * 60000) },
        { position: 9, email: "jamie***@gmail.com", joinedAt: new Date(Date.now() - 65 * 60000) },
        { position: 10, email: "drew***@hotmail.com", joinedAt: new Date(Date.now() - 60 * 60000) },
        { position: 11, email: "avery***@gmail.com", joinedAt: new Date(Date.now() - 55 * 60000) },
        { position: 12, email: "quinn***@yahoo.com", joinedAt: new Date(Date.now() - 50 * 60000) },
        { position: 13, email: "sage***@outlook.com", joinedAt: new Date(Date.now() - 45 * 60000) },
        { position: 14, email: "rowan***@gmail.com", joinedAt: new Date(Date.now() - 40 * 60000) },
        { position: 15, email: "phoenix***@icloud.com", joinedAt: new Date(Date.now() - 35 * 60000) },
      ];

      // Add real entries with masked emails
      const realEntries = entries.map(entry => ({
        position: entry.position,
        email: maskEmail(entry.email),
        joinedAt: entry.joinedAt,
      }));

      // Combine mock entries with real entries, sort by position
      const allEntries = [...mockEntries, ...realEntries].sort((a, b) => a.position - b.position);
      const displayEntries = allEntries.slice(0, 15); // Show top 15 for scrollable list

      // Get active drop for dynamic queue growth
      const activeDrop = await storage.getActiveDrop();
      const timeUntilDrop = activeDrop ? activeDrop.dropTime.getTime() - Date.now() : 0;
      
      // Simulate queue growth - add 1 person every 20-30 seconds during the hour before drop
      const minutesUntilDrop = Math.max(0, timeUntilDrop / (1000 * 60));
      let simulatedTotal = consistentTotal;
      
      // Only grow if we're within 1 hour of drop time
      if (minutesUntilDrop <= 60) {
        const secondsUntilDrop = Math.max(0, timeUntilDrop / 1000);
        // Add 1 person roughly every 25 seconds during the last hour
        const additionalPeople = Math.floor((3600 - secondsUntilDrop) / 25);
        simulatedTotal = Math.min(293, consistentTotal + additionalPeople);
      }

      res.json({
        totalSize: simulatedTotal,
        topEntries: displayEntries,
        activeDrop,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get queue stats" });
    }
  });

  // Join queue
  app.post("/api/queue/join", async (req, res) => {
    try {
      const validatedData = insertQueueEntrySchema.parse(req.body);
      
      // Check if queue is full
      const totalSize = await storage.getTotalQueueSize();
      if (totalSize >= 300) {
        return res.status(400).json({ message: "Queue is full" });
      }

      const entry = await storage.createQueueEntry(validatedData);
      
      res.json({
        id: entry.id,
        position: entry.position,
        email: entry.email,
        estimatedWaitTime: Math.ceil(entry.position / 10), // ~10 people per minute
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      
      if (error instanceof Error && error.message === "Email already exists in queue") {
        return res.status(400).json({ message: "Email already exists in queue" });
      }
      
      res.status(500).json({ message: "Failed to join queue" });
    }
  });

  // Get user position by email
  app.get("/api/queue/position/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const entry = await storage.getQueueEntryByEmail(email);
      
      if (!entry) {
        return res.status(404).json({ message: "Email not found in queue" });
      }

      res.json({
        position: entry.position,
        email: entry.email,
        estimatedWaitTime: Math.ceil(entry.position / 10),
        peopleAhead: entry.position - 1,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get position" });
    }
  });

  // Instagram verification
  app.post("/api/queue/instagram-verify", async (req, res) => {
    try {
      const { email, instagramUsername } = req.body;
      
      if (!email || !instagramUsername) {
        return res.status(400).json({ message: "Email and Instagram username are required" });
      }

      // Check if user exists in queue
      const existingEntry = await storage.getQueueEntryByEmail(email);
      if (!existingEntry) {
        return res.status(404).json({ message: "Email not found in queue" });
      }

      // Check if user already used Instagram boost
      if (existingEntry.instagramBoostUsed) {
        return res.status(400).json({ message: "Instagram boost already used for this email" });
      }

      // Update the entry with Instagram info and boost position
      const updatedEntry = await storage.updateQueueEntryInstagram(email, instagramUsername);
      
      if (!updatedEntry) {
        return res.status(500).json({ message: "Failed to update Instagram information" });
      }

      res.json({
        success: true,
        newPosition: updatedEntry.position,
        positionsSkipped: existingEntry.position - updatedEntry.position,
        message: `Successfully verified! You moved up ${existingEntry.position - updatedEntry.position} spots!`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify Instagram" });
    }
  });

  // Admin routes for drop management
  app.get("/api/admin/drops", async (req, res) => {
    try {
      const drops = await storage.getAllDrops();
      res.json(drops);
    } catch (error) {
      res.status(500).json({ message: "Failed to get drops" });
    }
  });

  app.post("/api/admin/drops", async (req, res) => {
    try {
      const validatedData = insertDropSchema.parse({
        ...req.body,
        dropTime: new Date(req.body.dropTime),
      });
      
      const drop = await storage.createDrop(validatedData);
      res.json(drop);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create drop" });
    }
  });

  app.put("/api/admin/drops/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      if (updates.dropTime) {
        updates.dropTime = new Date(updates.dropTime);
      }
      
      const updatedDrop = await storage.updateDrop(id, updates);
      if (!updatedDrop) {
        return res.status(404).json({ message: "Drop not found" });
      }
      
      res.json(updatedDrop);
    } catch (error) {
      res.status(500).json({ message: "Failed to update drop" });
    }
  });

  app.delete("/api/admin/drops/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteDrop(id);
      
      if (!success) {
        return res.status(404).json({ message: "Drop not found" });
      }
      
      res.json({ message: "Drop deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete drop" });
    }
  });

  // Admin route to get all queue entries
  app.get("/api/admin/queue", async (req, res) => {
    try {
      const entries = await storage.getAllQueueEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to get queue entries" });
    }
  });

  // Settings management routes
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || { instagramPostUrl: null, instagramBoostEnabled: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.put("/api/admin/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Instagram verification route
  app.post("/api/instagram/verify", async (req, res) => {
    try {
      const { email, instagramUsername } = req.body;
      
      if (!email || !instagramUsername) {
        return res.status(400).json({ message: "Email and Instagram username required" });
      }

      // Simple verification - in production you'd verify they actually shared
      // For now, we trust users and just log the attempt
      console.log(`Instagram verification attempt: ${email} -> @${instagramUsername}`);
      
      res.json({ 
        verified: true, 
        message: "Instagram share verified! You've moved up 100 spots." 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify Instagram share" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
