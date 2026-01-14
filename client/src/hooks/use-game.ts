import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Types derived from schema via routes
type CreateRoomInput = z.infer<typeof api.rooms.create.input>;
type JoinRoomInput = z.infer<typeof api.rooms.join.input>;
type RoomResponse = z.infer<typeof api.rooms.get.responses[200]>;
type WsMessage = { type: string; payload: any };

// Helper to get/set session ID from localStorage
function getSessionId(): string | null {
  return localStorage.getItem('playerId');
}

function setSessionId(sessionId: string): void {
  localStorage.setItem('playerId', sessionId);
}

// WebSocket Hook
export function useGameSocket(roomCode?: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Simple reconnect logic could be added here
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Send JOIN_ROOM message when connected
      ws.send(JSON.stringify({ type: 'JOIN_ROOM', payload: { code: roomCode } }));
    };
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);
        if (message.type === 'UPDATE_ROOM') {
          // Trigger a refetch to get personalized data with session ID
          queryClient.invalidateQueries({ queryKey: [api.rooms.get.path, roomCode] });
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [roomCode, queryClient]);

  return isConnected;
}

// API Hooks
export function useRoom(code: string) {
  // Always try to connect to socket if we have a code
  useGameSocket(code);
  const sessionId = getSessionId();

  return useQuery({
    queryKey: [api.rooms.get.path, code, sessionId], // Include sessionId in key so it refetches when it changes
    queryFn: async () => {
      const url = buildUrl(api.rooms.get.path, { code });
      const currentSessionId = getSessionId();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (currentSessionId) {
        headers["x-session-id"] = currentSessionId;
      }
      const res = await fetch(url, { 
        credentials: "include",
        headers
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch room");
      return api.rooms.get.responses[200].parse(await res.json());
    },
    // Don't refetch on window focus as WS handles updates
    refetchOnWindowFocus: false,
    // Enable the query even if sessionId is null initially (it will be set soon)
    enabled: !!code,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateRoomInput) => {
      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create room");
      }
      return api.rooms.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      setSessionId(data.playerId);
      queryClient.setQueryData(["playerId"], data.playerId);
      // The query will automatically refetch when sessionId changes (it's in the query key)
      setLocation(`/room/${data.code}`);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: JoinRoomInput) => {
      const res = await fetch(api.rooms.join.path, {
        method: api.rooms.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Room not found");
        const error = await res.json();
        throw new Error(error.message || "Failed to join room");
      }
      return api.rooms.join.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      setSessionId(data.playerId);
      queryClient.setQueryData(["playerId"], data.playerId);
      // The query will automatically refetch when sessionId changes (it's in the query key)
      setLocation(`/room/${data.code}`);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

export function useStartGame(code: string) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.rooms.start.path, { code });
      const res = await fetch(url, {
        method: api.rooms.start.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to start game");
      }
      return api.rooms.start.responses[200].parse(await res.json());
    },
    onError: (err) => {
      toast({
        title: "Cannot start game",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

export function useResetGame(code: string) {
  return useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.rooms.reset.path, { code });
      const res = await fetch(url, {
        method: api.rooms.reset.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to reset game");
      return api.rooms.reset.responses[200].parse(await res.json());
    },
  });
}
