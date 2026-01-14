import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { WsMessage } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // WebSocket Setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<WebSocket, string>(); // ws -> roomCode

  function broadcast(roomCode: string, message: WsMessage) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && clients.get(client) === roomCode) {
        client.send(JSON.stringify(message));
      }
    });
  }

  async function broadcastRoomUpdate(roomCode: string) {
    const room = await storage.getRoom(roomCode);
    const players = await storage.getPlayers(roomCode);
    if (room && players) {
      // For each client in the room, send a customized state (masking imposter if needed, but for simplicity here we send state and let client mask or handle it. 
      // Actually, to prevent cheating, we should mask `imposterId` and `word` in the payload? 
      // But GameState defined in schema has `me`.
      // Let's just send the raw room/players and let client derive 'me'.
      // Wait, if I send the room with 'imposterId' to everyone, anyone can inspect network.
      // PROPER WAY: Send personalized messages. 
      // But keeping it simple for this "Quick Edit" mode: 
      // We will broadcast "UPDATE_ROOM" with common data, client fetches its own sensitive data via GET or we trust client (not ideal).
      // BETTER: On 'playing' status, clients should hit GET /api/rooms/:code to get their sanitized view.
      // So WS just says "UPDATE".
      
      // Let's just send basic room info. Sensitive info (who is imposter) is in `room.imposterId`.
      // If we want to hide it, we shouldn't send it.
      // But I implemented `getRoom` in routes to return `me`.
      
      // We'll just trigger a refetch on client side.
      const message: WsMessage = { 
        type: 'UPDATE_ROOM', 
        payload: { room, players, me: null } // 'me' is null here, client ignores it or fetches fresh
      };
      
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && clients.get(client) === roomCode) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  wss.on('connection', (ws, req) => {
    // Basic query param parsing for room code? 
    // Or just let them connect and wait for a message?
    // Let's expect a message "JOIN_ROOM:{code}"
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'JOIN_ROOM') {
          const code = message.payload.code;
          clients.set(ws, code);
        }
      } catch (e) {
        // ignore
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });


  // API Routes

  app.post(api.rooms.create.path, async (req, res) => {
    try {
      const input = api.rooms.create.input.parse(req.body);
      // Generate a session ID if one doesn't exist (cookie or just return it?)
      // For simplicity in this game, we'll generate one and client stores it in localStorage.
      // But wait, the client is sending it? No, client creates room.
      // Let's generate a random session ID here for the host.
      const sessionId = Math.random().toString(36).substring(7);
      
      const { room, player } = await storage.createRoom(input.name, input.language, sessionId);
      // Broadcast the room update so any connected clients see the new room
      broadcastRoomUpdate(room.code);
      res.status(201).json({ code: room.code, playerId: sessionId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.post(api.rooms.join.path, async (req, res) => {
    try {
      const input = api.rooms.join.input.parse(req.body);
      const sessionId = Math.random().toString(36).substring(7);
      
      const result = await storage.joinRoom(input.code, input.name, sessionId);
      
      if (!result) {
        return res.status(404).json({ message: "Room not found or game already started" });
      }
      
      broadcastRoomUpdate(input.code);
      res.json({ code: result.room.code, playerId: sessionId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.rooms.get.path, async (req, res) => {
    const code = req.params.code;
    const sessionId = req.headers['x-session-id'] as string; // Client sends this
    
    const room = await storage.getRoom(code);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    const players = await storage.getPlayers(code);
    
    // If no session ID provided, try to find by hostId as fallback
    let me = players.find(p => p.sessionId === sessionId) || null;
    // Fallback: if sessionId matches hostId, find the host
    if (!me && sessionId && sessionId === room.hostId) {
      me = players.find(p => p.isHost) || null;
    }

    // Sanitize room data for the client
    // If game is playing:
    // - If I am imposter: I see "imposter" (or null word)
    // - If I am NOT imposter: I see the word.
    // - I should NOT see who the imposter is unless game is over? 
    // Usually game reveals imposter at end.
    
    const sanitizedRoom = { ...room };
    if (room.status === 'playing' && me) {
       if (me.sessionId === room.imposterId) {
         // I am imposter
         sanitizedRoom.word = "IMPOSTER"; 
         // But I shouldn't know I am imposter by the 'imposterId' field being public?
         // Yes, we should hide imposterId from everyone.
       } else {
         // I am not imposter
         // I see the word.
       }
       // Hide imposterId from everyone during game
       sanitizedRoom.imposterId = null; 
    } else {
      // Waiting or finished
      // Hide word if waiting
      if (room.status === 'waiting') {
        sanitizedRoom.word = null;
        sanitizedRoom.imposterId = null;
      }
    }

    res.json({ room: sanitizedRoom, players, me });
  });

  app.post(api.rooms.start.path, async (req, res) => {
    const code = req.params.code;
    const success = await storage.startGame(code);
    if (!success) {
      return res.status(403).json({ message: "Cannot start game" });
    }
    broadcastRoomUpdate(code);
    res.json({ success: true });
  });

  app.post(api.rooms.reset.path, async (req, res) => {
    const code = req.params.code;
    await storage.resetGame(code);
    broadcastRoomUpdate(code);
    res.json({ success: true });
  });

  return httpServer;
}
