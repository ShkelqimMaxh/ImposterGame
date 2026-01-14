import { useState, useEffect } from "react";
import { useJoinRoom } from "@/hooks/use-game";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link } from "lucide-react";

export function JoinRoomModal({ trigger }: { trigger: React.ReactNode }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const joinRoom = useJoinRoom();

  // Close modal when room is successfully joined
  useEffect(() => {
    if (joinRoom.isSuccess) {
      setOpen(false);
    }
  }, [joinRoom.isSuccess]);

  // Extract room code from URL or return the input as-is if it's already a code
  const extractRoomCode = (input: string): string | null => {
    const trimmed = input.trim().toUpperCase();
    
    // If it's already a 4-character code, return it
    if (/^[A-Z]{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Try to extract code from URL pattern (e.g., /room/ABCD)
    const urlMatch = trimmed.match(/\/room\/([A-Z0-9]{4})/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }
    
    // Try to extract from full URL
    try {
      const url = new URL(trimmed);
      const pathMatch = url.pathname.match(/\/room\/([A-Z0-9]{4})/i);
      if (pathMatch && pathMatch[1]) {
        return pathMatch[1].toUpperCase();
      }
    } catch (e) {
      // Not a valid URL, continue
    }
    
    return null;
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const extracted = extractRoomCode(pasted);
    if (extracted) {
      setCode(extracted);
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extracted = extractRoomCode(code);
    const finalCode = extracted || code.trim().toUpperCase();
    if (finalCode.length === 4 && /^[A-Z]{4}$/.test(finalCode)) {
      joinRoom.mutate({ code: finalCode, name });
    }
  };

  // Check if we have a valid code (either direct code or extractable from input)
  const isValidCode = (): boolean => {
    const extracted = extractRoomCode(code);
    const finalCode = extracted || code.trim().toUpperCase();
    return finalCode.length === 4 && /^[A-Z]{4}$/.test(finalCode);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Label htmlFor="room-code" className="text-base font-semibold">Room Code or Link</Label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="room-code"
                placeholder="ABCD or paste room link"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onPaste={handlePaste}
                className="pl-12 text-lg py-6 font-mono tracking-widest uppercase border-2 focus-visible:ring-secondary/20"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter a 4-letter code or paste a room link</p>
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
            disabled={joinRoom.isPending || !name || !isValidCode()}
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
