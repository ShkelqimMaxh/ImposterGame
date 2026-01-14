import { useState, useEffect } from "react";
import { useCreateRoom } from "@/hooks/use-game";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CreateRoomModal({ trigger }: { trigger: React.ReactNode }) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"en" | "sq" | "es" | "de">("en");
  const [open, setOpen] = useState(false);
  const createRoom = useCreateRoom();

  // Close modal when room is successfully created
  useEffect(() => {
    if (createRoom.isSuccess) {
      setOpen(false);
    }
  }, [createRoom.isSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoom.mutate({ name, language });
  };

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "sq", label: "Shqip", flag: "🇦🇱" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-2 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Create New Game
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">Your Name</Label>
            <Input
              id="name"
              placeholder="e.g. Captain Sus"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => {
                // Scroll input into view on mobile when keyboard opens
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
              className="text-lg py-6 border-2 focus-visible:ring-primary/20"
              maxLength={12}
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Game Language</Label>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => {
                const isSelected = language === lang.code;
                const isAlbanian = lang.code === 'sq';
                
                return (
                  <div
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`
                      cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all duration-200
                      ${isSelected
                        ? isAlbanian
                          ? 'border-red-600/30 bg-gradient-to-br from-red-600 via-red-900 to-black shadow-lg shadow-red-900/20 scale-[1.02] text-white'
                          : 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
                        : 'border-transparent bg-secondary/5 hover:bg-secondary/10 hover:border-secondary/20'}
                    `}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className={`font-medium ${isSelected && isAlbanian ? 'text-white' : ''}`}>{lang.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            disabled={createRoom.isPending || !name}
          >
            {createRoom.isPending ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <>
                Create Room <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
