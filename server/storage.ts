import { type QueueEntry, type InsertQueueEntry, type Drop, type InsertDrop, type Settings, type InsertSettings, queueEntries, drops, settings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, count } from "drizzle-orm";

export interface IStorage {
  getQueueEntry(id: string): Promise<QueueEntry | undefined>;
  getQueueEntryByEmail(email: string): Promise<QueueEntry | undefined>;
  createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntry>;
  getAllQueueEntries(): Promise<QueueEntry[]>;
  getQueuePosition(email: string): Promise<number | null>;
  getTotalQueueSize(): Promise<number>;
  deleteQueueEntry(id: string): Promise<boolean>;
  updateQueueEntryInstagram(email: string, instagramUsername: string): Promise<QueueEntry | undefined>;
  
  // Drop management
  createDrop(drop: InsertDrop): Promise<Drop>;
  getActiveDrop(): Promise<Drop | undefined>;
  getAllDrops(): Promise<Drop[]>;
  updateDrop(id: string, updates: Partial<InsertDrop>): Promise<Drop | undefined>;
  deleteDrop(id: string): Promise<boolean>;
  
  // Settings management
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getQueueEntry(id: string): Promise<QueueEntry | undefined> {
    const [entry] = await db.select().from(queueEntries).where(eq(queueEntries.id, id));
    return entry || undefined;
  }

  async getQueueEntryByEmail(email: string): Promise<QueueEntry | undefined> {
    const [entry] = await db.select().from(queueEntries).where(eq(queueEntries.email, email));
    return entry || undefined;
  }

  async createQueueEntry(insertEntry: InsertQueueEntry): Promise<QueueEntry> {
    // Check if email already exists
    const existing = await this.getQueueEntryByEmail(insertEntry.email);
    if (existing) {
      throw new Error("Email already exists in queue");
    }

    // Get the actual database count (not including mock base)
    const [result] = await db.select({ count: count() }).from(queueEntries);
    const actualDbCount = result.count;
    
    // Start positions after the mock base of 283 people
    const position = 284 + actualDbCount;
    
    const [entry] = await db
      .insert(queueEntries)
      .values({
        ...insertEntry,
        position,
      })
      .returning();
    
    return entry;
  }

  async getAllQueueEntries(): Promise<QueueEntry[]> {
    return await db.select().from(queueEntries).orderBy(queueEntries.position);
  }

  async getQueuePosition(email: string): Promise<number | null> {
    const entry = await this.getQueueEntryByEmail(email);
    return entry ? entry.position : null;
  }

  async getTotalQueueSize(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(queueEntries);
    // Add mock base size of 283 to maintain consistency
    return result.count + 283;
  }

  async deleteQueueEntry(id: string): Promise<boolean> {
    const result = await db.delete(queueEntries).where(eq(queueEntries.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateQueueEntryInstagram(email: string, instagramUsername: string): Promise<QueueEntry | undefined> {
    // First get current position
    const currentEntry = await this.getQueueEntryByEmail(email);
    if (!currentEntry) return undefined;
    
    const newPosition = Math.max(1, currentEntry.position - 100);
    
    const [updatedEntry] = await db
      .update(queueEntries)
      .set({ 
        instagramUsername,
        instagramBoostUsed: true,
        position: newPosition
      })
      .where(eq(queueEntries.email, email))
      .returning();
    
    return updatedEntry || undefined;
  }

  // Drop management
  async createDrop(drop: InsertDrop): Promise<Drop> {
    const [newDrop] = await db
      .insert(drops)
      .values(drop)
      .returning();
    
    return newDrop;
  }

  async getActiveDrop(): Promise<Drop | undefined> {
    const [drop] = await db
      .select()
      .from(drops)
      .where(eq(drops.isActive, true))
      .orderBy(desc(drops.createdAt))
      .limit(1);
    
    return drop || undefined;
  }

  async getAllDrops(): Promise<Drop[]> {
    return await db.select().from(drops).orderBy(desc(drops.createdAt));
  }

  async updateDrop(id: string, updates: Partial<InsertDrop>): Promise<Drop | undefined> {
    const [updatedDrop] = await db
      .update(drops)
      .set(updates)
      .where(eq(drops.id, id))
      .returning();
    
    return updatedDrop || undefined;
  }

  async deleteDrop(id: string): Promise<boolean> {
    const result = await db.delete(drops).where(eq(drops.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting || undefined;
  }

  async updateSettings(newSettings: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ ...newSettings, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values(newSettings)
        .returning();
      return created;
    }
  }
}

export class MemStorage implements IStorage {
  private queueEntries: Map<string, QueueEntry>;
  private emailToId: Map<string, string>;
  private mockDrops: Drop[] = [];
  private mockSettings: Settings | undefined;

  constructor() {
    this.queueEntries = new Map();
    this.emailToId = new Map();
    
    // Pre-populate with mock queue entries to simulate existing queue
    this.initializeMockQueue();
    this.initializeMockDrop();
  }

  private initializeMockDrop() {
    // Create a mock drop with a future drop time
    const mockDrop: Drop = {
      id: randomUUID(),
      name: "LOCKS SOLD Exclusive Drop",
      description: "Limited edition collection - Don't miss out!",
      dropTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now for testing
      isActive: true,
      maxQueueSize: 293,
      createdAt: new Date(),
    };
    this.mockDrops.push(mockDrop);
  }

  private initializeMockQueue() {
    const mockEmails = [
      "alex_***@gmail.com",
      "jordan_***@yahoo.com", 
      "sam_***@hotmail.com",
      "casey_***@gmail.com"
    ];

    mockEmails.forEach((email, index) => {
      const id = randomUUID();
      const entry: QueueEntry = {
        id,
        email,
        phone: null,
        position: index + 1,
        notifications: false,
        instagramUsername: null,
        instagramBoostUsed: false,
        joinedAt: new Date(Date.now() - (120 - index * 10) * 60000), // Stagger join times
      };
      this.queueEntries.set(id, entry);
      this.emailToId.set(email, id);
    });

    // Add more mock entries to reach ~283 people (more realistic number)
    for (let i = 5; i <= 283; i++) {
      const id = randomUUID();
      const entry: QueueEntry = {
        id,
        email: `user${i}_***@email.com`,
        phone: null,
        position: i,
        notifications: false,
        instagramUsername: null,
        instagramBoostUsed: false,
        joinedAt: new Date(Date.now() - (120 - i) * 60000),
      };
      this.queueEntries.set(id, entry);
      this.emailToId.set(entry.email, id);
    }
  }

  async getQueueEntry(id: string): Promise<QueueEntry | undefined> {
    return this.queueEntries.get(id);
  }

  async getQueueEntryByEmail(email: string): Promise<QueueEntry | undefined> {
    const id = this.emailToId.get(email);
    if (!id) return undefined;
    return this.queueEntries.get(id);
  }

  async createQueueEntry(insertEntry: InsertQueueEntry): Promise<QueueEntry> {
    // Check if email already exists
    if (this.emailToId.has(insertEntry.email)) {
      throw new Error("Email already exists in queue");
    }

    const id = randomUUID();
    const position = this.queueEntries.size + 1;
    
    const entry: QueueEntry = {
      id,
      email: insertEntry.email,
      phone: insertEntry.phone || null,
      notifications: insertEntry.notifications || false,
      position,
      instagramUsername: null,
      instagramBoostUsed: false,
      joinedAt: new Date(),
    };
    
    this.queueEntries.set(id, entry);
    this.emailToId.set(insertEntry.email, id);
    
    return entry;
  }

  async getAllQueueEntries(): Promise<QueueEntry[]> {
    return Array.from(this.queueEntries.values()).sort((a, b) => 
      a.position - b.position
    );
  }

  async getQueuePosition(email: string): Promise<number | null> {
    const entry = await this.getQueueEntryByEmail(email);
    return entry ? entry.position : null;
  }

  async getTotalQueueSize(): Promise<number> {
    return this.queueEntries.size;
  }

  async deleteQueueEntry(id: string): Promise<boolean> {
    const entry = this.queueEntries.get(id);
    if (!entry) return false;
    
    this.queueEntries.delete(id);
    this.emailToId.delete(entry.email);
    return true;
  }

  async updateQueueEntryInstagram(email: string, instagramUsername: string): Promise<QueueEntry | undefined> {
    const id = this.emailToId.get(email);
    if (!id) return undefined;
    
    const entry = this.queueEntries.get(id);
    if (!entry) return undefined;
    
    const newPosition = Math.max(1, entry.position - 100);
    const updatedEntry: QueueEntry = {
      ...entry,
      instagramUsername,
      instagramBoostUsed: true,
      position: newPosition
    };
    
    this.queueEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Drop management
  async createDrop(drop: InsertDrop): Promise<Drop> {
    const newDrop: Drop = {
      id: randomUUID(),
      name: drop.name,
      description: drop.description || null,
      dropTime: drop.dropTime,
      isActive: true,
      maxQueueSize: drop.maxQueueSize,
      createdAt: new Date(),
    };
    this.mockDrops.push(newDrop);
    return newDrop;
  }

  async getActiveDrop(): Promise<Drop | undefined> {
    return this.mockDrops.find(drop => drop.isActive);
  }

  async getAllDrops(): Promise<Drop[]> {
    return [...this.mockDrops].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateDrop(id: string, updates: Partial<InsertDrop>): Promise<Drop | undefined> {
    const index = this.mockDrops.findIndex(drop => drop.id === id);
    if (index === -1) return undefined;
    
    this.mockDrops[index] = { ...this.mockDrops[index], ...updates };
    return this.mockDrops[index];
  }

  async deleteDrop(id: string): Promise<boolean> {
    const index = this.mockDrops.findIndex(drop => drop.id === id);
    if (index === -1) return false;
    
    this.mockDrops.splice(index, 1);
    return true;
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.mockSettings;
  }

  async updateSettings(newSettings: InsertSettings): Promise<Settings> {
    this.mockSettings = {
      id: this.mockSettings?.id || randomUUID(),
      instagramPostUrl: newSettings.instagramPostUrl || null,
      instagramBoostEnabled: newSettings.instagramBoostEnabled || false,
      createdAt: this.mockSettings?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    return this.mockSettings;
  }
}

export const storage = new DatabaseStorage();
