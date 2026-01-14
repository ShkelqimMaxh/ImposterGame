import { useParams, useLocation } from "wouter";
import { useRoom, useStartGame, useResetGame, useJoinRoom } from "@/hooks/use-game";
import { RevealerCard } from "@/components/RevealerCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Crown, RotateCcw, Play, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function Room() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { data: gameState, isLoading, error, refetch } = useRoom(code!);
  const startGame = useStartGame(code!);
  const resetGame = useResetGame(code!);
  const joinRoom = useJoinRoom();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [joinName, setJoinName] = useState("");

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: "Room not found or expired", variant: "destructive" });
      setLocation("/");
    }
  }, [error, setLocation, toast]);

  // If me is null but we have a session ID, retry the query
  // If no session ID, immediately show join form (user accessing via link)
  useEffect(() => {
    if (!isLoading && gameState && !gameState.me) {
      const sessionId = localStorage.getItem('playerId');
      
      // If no session ID, user is accessing via link - show join form immediately
      if (!sessionId) {
        setRetryCount(2); // Set to 2 to immediately show join form
        return;
      }
      
      // If we have a session ID but user not found, retry a couple times
      if (sessionId && retryCount < 2) {
        // Wait a bit and retry
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          refetch();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, gameState, retryCount, refetch]);

  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const { room, players, me } = gameState;
  const isHost = me?.isHost;
  const isPlaying = room.status === "playing";

  const copyRoomLink = async () => {
    const roomUrl = `${window.location.origin}/room/${room.code}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast({ title: "Copied!", description: "Room link copied to clipboard" });
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = roomUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({ title: "Copied!", description: "Room link copied to clipboard" });
      } catch (fallbackErr) {
        toast({ title: "Error", description: "Failed to copy link. Please copy manually: " + roomUrl, variant: "destructive" });
      }
      document.body.removeChild(textArea);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      toast({ title: "Copied!", description: "Room code copied to clipboard" });
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = room.code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({ title: "Copied!", description: "Room code copied to clipboard" });
      } catch (fallbackErr) {
        toast({ title: "Error", description: "Failed to copy code", variant: "destructive" });
      }
      document.body.removeChild(textArea);
    }
  };

  const handleJoinFromLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (code && joinName.trim()) {
      joinRoom.mutate({ code, name: joinName.trim() });
    }
  };

  // If user is not in room and we've tried retries (or no session ID), show join form
  if (!me && retryCount >= 2 && gameState && gameState.room.status === "waiting") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Join Room</h2>
            <p className="text-muted-foreground mb-2">Room Code: <span className="font-mono font-bold text-primary">{code}</span></p>
            <p className="text-sm text-muted-foreground">{gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''} waiting</p>
          </div>

          <form onSubmit={handleJoinFromLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-name" className="text-base font-semibold">Your Name</Label>
              <Input
                id="join-name"
                placeholder="e.g. Sneaky Pete"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                onFocus={(e) => {
                  // Scroll input into view on mobile when keyboard opens
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
                className="text-lg py-6 border-2"
                maxLength={12}
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-xl"
              disabled={joinRoom.isPending || !joinName.trim()}
            >
              {joinRoom.isPending ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                "Join Game"
              )}
            </Button>
            
            {joinRoom.isError && (
              <p className="text-sm text-destructive text-center">
                {joinRoom.error?.message || "Failed to join room"}
              </p>
            )}
          </form>

          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="w-full"
          >
            Go Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // If room doesn't exist or game started, show error
  if (!me && retryCount >= 2 && gameState && gameState.room.status === "playing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">This game has already started.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  // If me is null but we're still retrying, show loading
  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 max-w-md mx-auto relative overflow-hidden">
      
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-6 z-10">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Room Code</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={copyCode}
              className="flex items-center gap-2 text-3xl font-black font-mono text-primary hover:opacity-80 transition-opacity"
              title="Copy room code"
            >
              {room.code}
              <Copy className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={copyRoomLink}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Copy room link"
            >
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-2 rounded-full">
          {players.length} Player{players.length !== 1 ? 's' : ''}
        </Badge>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 flex flex-col justify-center py-8"
            >
              <RevealerCard 
                word={room.word} 
                isImposter={room.imposterId === me.sessionId}
                language={room.language as "en" | "sq" | "es" | "de"}
              />

              {/* Game Rules */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center"
              >
                <p className="text-sm text-muted-foreground font-medium">
                  Start with hinting 1 by 1
                </p>
              </motion.div>

              {isHost && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-8 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => resetGame.mutate()}
                      disabled={resetGame.isPending}
                      className="h-14 rounded-xl border-2 border-muted-foreground/30 hover:bg-muted"
                    >
                      <RotateCcw className="mr-2 w-5 h-5" />
                      Retry
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          await resetGame.mutateAsync();
                          setLocation("/");
                        } catch (err) {
                          // If reset fails, just navigate home anyway
                          setLocation("/");
                        }
                      }}
                      disabled={resetGame.isPending}
                      className="h-14 rounded-xl border-2 border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
                    >
                      <X className="mr-2 w-5 h-5" />
                      Close Game
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Waiting for players...</h2>
                <p className="text-muted-foreground">
                  {isHost ? "Start the game when everyone is ready!" : "Host will start the game soon."}
                </p>
              </div>

              {/* Player Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    layoutId={player.id.toString()}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`
                      p-4 rounded-xl border-2 flex items-center gap-3 bg-card
                      ${player.isHost ? 'border-primary/30 bg-primary/5' : 'border-border'}
                      ${player.sessionId === me.sessionId ? 'ring-2 ring-offset-2 ring-primary' : ''}
                    `}
                  >
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className={`font-bold ${player.isHost ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
                        {player.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold truncate text-sm">
                        {player.name} {player.sessionId === me.sessionId && "(You)"}
                      </span>
                      {player.isHost && (
                        <span className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Host
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto">
                {isHost ? (
                  <Button
                    onClick={() => startGame.mutate()}
                    disabled={startGame.isPending || players.length < 3}
                    className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1 active:translate-y-0"
                  >
                    {startGame.isPending ? (
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Play className="mr-2 h-6 w-6 fill-current" />
                        Start Game
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-muted/50 rounded-xl p-6 text-center border-2 border-dashed border-muted-foreground/20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium text-muted-foreground">Waiting for host to start...</p>
                  </div>
                )}
                
                {isHost && players.length < 3 && (
                  <p className="text-center text-sm text-destructive font-medium mt-4 bg-destructive/10 py-2 rounded-lg">
                    Need at least 3 players to start
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
