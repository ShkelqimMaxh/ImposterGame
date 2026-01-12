import { useState } from "react";
import { useJoinRoom } from "@/hooks/use-game";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Key } from "lucide-react";

export function JoinRoomModal({ trigger }: { trigger: React.ReactNode }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const joinRoom = useJoinRoom();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinRoom.mutate({ code, name });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-2 border-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Join Existing Game
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="room-code" className="text-base font-semibold">Room Code</Label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="room-code"
                placeholder="ABCD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pl-12 text-lg py-6 font-mono tracking-widest uppercase border-2 focus-visible:ring-secondary/20"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-name" className="text-base font-semibold">Your Name</Label>
            <Input
              id="player-name"
              placeholder="e.g. Sneaky Pete"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg py-6 border-2 focus-visible:ring-secondary/20"
              maxLength={12}
              required
            />
          </div>

          <Button 
            type="submit" 
            variant="secondary"
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-secondary/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            disabled={joinRoom.isPending || !name || code.length !== 4}
          >
            {joinRoom.isPending ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              "Join Game"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
