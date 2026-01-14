import { type Room, type Player, type LangCode } from "@shared/schema";
import { getRandomWord } from "./words";

export interface IStorage {
  createRoom(name: string, language: LangCode, hostId: string): Promise<{ room: Room; player: Player }>;
  joinRoom(code: string, name: string, sessionId: string): Promise<{ room: Room; player: Player } | undefined>;
  getRoom(code: string): Promise<Room | undefined>;
  getPlayers(roomId: string): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  startGame(code: string): Promise<boolean>;
  resetGame(code: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>; // code -> Room
  private players: Map<number, Player>; // id -> Player
  private roomPlayers: Map<string, number[]>; // code -> playerIds[]
  private nextRoomId = 1;
  private nextPlayerId = 1;

  constructor() {
    this.rooms = new Map();
    this.players = new Map();
    this.roomPlayers = new Map();
  }

  private generateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Simple collision check (not robust for production but fine for this game)
    if (this.rooms.has(code)) return this.generateCode();
    return code;
  }

  async createRoom(name: string, language: LangCode, sessionId: string): Promise<{ room: Room; player: Player }> {
    const code = this.generateCode();
    const roomId = String(this.nextRoomId++);
    
    const room: Room = {
      id: parseInt(roomId),
      code,
      hostId: sessionId,
      language,
      status: "waiting",
      word: null,
      imposterId: null,
    };

    const player: Player = {
      id: this.nextPlayerId++,
      sessionId,
      roomId: code, // Using code as roomId for easier lookup in this simple map
      name,
      isHost: true,
    };

    this.rooms.set(code, room);
    this.players.set(player.id, player);
    this.roomPlayers.set(code, [player.id]);

    return { room, player };
  }

  async joinRoom(code: string, name: string, sessionId: string): Promise<{ room: Room; player: Player } | undefined> {
    const room = this.rooms.get(code);
    if (!room) {
      return undefined;
    }

    // Check if player already in room (re-join)
    const existingPlayerIds = this.roomPlayers.get(code) || [];
    const existingPlayer = existingPlayerIds
      .map(id => this.players.get(id))
      .find(p => p?.sessionId === sessionId);

    if (existingPlayer) {
      return { room, player: existingPlayer };
    }

    if (room.status !== "waiting") {
      return undefined; // Cannot join if game started
    }

    const player: Player = {
      id: this.nextPlayerId++,
      sessionId,
      roomId: code,
      name,
      isHost: false,
    };

    this.players.set(player.id, player);
    existingPlayerIds.push(player.id);
    this.roomPlayers.set(code, existingPlayerIds);

    return { room, player };
  }

  async getRoom(code: string): Promise<Room | undefined> {
    return this.rooms.get(code);
  }

  async getPlayers(code: string): Promise<Player[]> {
    const ids = this.roomPlayers.get(code) || [];
    return ids.map(id => this.players.get(id)!).filter(Boolean);
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async startGame(code: string): Promise<boolean> {
    const room = this.rooms.get(code);
    if (!room) return false;

    const players = await this.getPlayers(code);
    if (players.length < 2) return false; // Need at least 2 players?

    const imposter = players[Math.floor(Math.random() * players.length)];
    const word = getRandomWord(room.language as LangCode);

    room.status = "playing";
    room.imposterId = imposter.sessionId;
    room.word = word;

    this.rooms.set(code, room);
    return true;
  }

  async resetGame(code: string): Promise<boolean> {
    const room = this.rooms.get(code);
    if (!room) return false;

    room.status = "waiting";
    room.word = null;
    room.imposterId = null;

    this.rooms.set(code, room);
    return true;
  }
}

export const storage = new MemStorage();
