import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll use in-memory storage, but defining schemas ensures type safety
// and makes it easy to switch to DB later if needed.

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 4-letter code
  hostId: text("host_id").notNull(),
  language: text("language").notNull().default("en"), // en, sq, es, de
  status: text("status").notNull().default("waiting"), // waiting, playing
  word: text("word"), // The current secret word
  imposterId: text("imposter_id"), // ID of the imposter
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // Unique browser ID
  roomId: text("room_id").notNull(),
  name: text("name").notNull(),
  isHost: boolean("is_host").default(false),
});

// Schemas
export const createRoomSchema = z.object({
  name: z.string().min(2).max(12),
  language: z.enum(["en", "sq", "es", "de"]),
});

export const joinRoomSchema = z.object({
  code: z.string().length(4).transform(s => s.toUpperCase()),
  name: z.string().min(2).max(12),
});

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;

// Application types
export type LangCode = "en" | "sq" | "es" | "de";

export interface GameState {
  room: Room;
  players: Player[];
  me: Player | null;
}

// WS Messages
export type WsMessage = 
  | { type: 'UPDATE_ROOM'; payload: GameState }
  | { type: 'ERROR'; payload: { message: string } };
