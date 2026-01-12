import { useParams, useLocation } from "wouter";
import { useRoom, useStartGame, useResetGame } from "@/hooks/use-game";
import { RevealerCard } from "@/components/RevealerCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Crown, RotateCcw, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function Room() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { data: gameState, isLoading, error } = useRoom(code!);
  const startGame = useStartGame(code!);
  const resetGame = useResetGame(code!);
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: "Room not found or expired", variant: "destructive" });
      setLocation("/");
    }
  }, [error, setLocation, toast]);

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

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    toast({ title: "Copied!", description: "Room code copied to clipboard" });
  };

  if (!me) {
    // Edge case: if session lost but room exists, redirect to join
    // In a real app we might handle reconnection better
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 max-w-md mx-auto relative overflow-hidden">
      
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-6 z-10">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Room Code</span>
          <button 
            onClick={copyCode}
            className="flex items-center gap-2 text-3xl font-black font-mono text-primary hover:opacity-80 transition-opacity"
          >
            {room.code}
            <Copy className="w-5 h-5 text-muted-foreground" />
          </button>
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
              />

              {isHost && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-12 space-y-4"
                >
                  <Button 
                    variant="outline"
                    onClick={() => resetGame.mutate()}
                    disabled={resetGame.isPending}
                    className="w-full h-14 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:bg-muted"
                  >
                    <RotateCcw className="mr-2 w-5 h-5" />
                    New Round
                  </Button>
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
