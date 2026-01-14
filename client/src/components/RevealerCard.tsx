import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

interface RevealerCardProps {
  word: string | null;
  isImposter: boolean;
  language?: "en" | "sq" | "es" | "de";
}

export function RevealerCard({ word, isImposter, language = "en" }: RevealerCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Get card gradient based on language flag colors
  const getCardGradient = () => {
    switch (language) {
      case "sq": // Albanian 🇦🇱 - Red and Black
        return "from-red-600 via-red-900 to-black";
      case "en": // English 🇬🇧 - Union Jack: Red, White, Blue
        return "from-red-600 via-blue-600 to-red-800";
      case "es": // Spanish 🇪🇸 - Red and Yellow
        return "from-red-600 via-yellow-500 to-red-700";
      case "de": // German 🇩🇪 - Black, Red, Yellow
        return "from-black via-red-600 to-yellow-500";
      default:
        return "from-red-600 via-blue-600 to-red-800";
    }
  };

  const getBorderColor = () => {
    switch (language) {
      case "sq": // Albanian - Red border
        return "border-red-500/20";
      case "en": // English - Blue border
        return "border-blue-500/20";
      case "es": // Spanish - Red border
        return "border-red-500/20";
      case "de": // German - Yellow border
        return "border-yellow-500/20";
      default:
        return "border-white/10";
    }
  };

  // Trigger haptic feedback if available
  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleStart = () => {
    setIsRevealed(true);
    vibrate();
    
    // Only throw confetti if you're the imposter for dramatic effect (or maybe just for everyone? let's do imposter only)
    if (isImposter) {
       // subtle confetti for effect
    }
  };

  const handleEnd = () => {
    setIsRevealed(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto aspect-[3/4] perspective-1000 relative select-none">
      <motion.div
        className="w-full h-full relative cursor-pointer"
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${getCardGradient()} shadow-2xl flex flex-col items-center justify-center p-8 text-white text-center border-4 ${getBorderColor()}`}
            >
              <div className="bg-white/20 rounded-full p-6 mb-6 animate-pulse">
                <Eye className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold font-display mb-2 text-white">Tap & Hold</h2>
              <p className="text-white/80 font-medium">to reveal your secret role</p>
              
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm text-sm border border-white/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-300" />
                  <span className="text-white">Don't let others see!</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              className={`
                absolute inset-0 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border-4
                ${isImposter 
                  ? 'bg-gradient-to-br from-red-500 to-orange-600 border-red-200 text-white' 
                  : 'bg-white border-primary/20 text-foreground'}
              `}
            >
              {isImposter ? (
                <>
                  <div className="text-6xl mb-6">🤫</div>
                  <h2 className="text-4xl font-black font-display uppercase tracking-wider mb-4">
                    Imposter
                  </h2>
                  <p className="text-white/90 text-lg font-medium leading-relaxed">
                    Blend in. Pretend you know the word. Don't get caught!
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold uppercase tracking-widest text-primary/60 mb-2">
                    Secret Word
                  </div>
                  <h2 className="text-5xl font-black font-display text-primary mb-8 break-words w-full">
                    {word}
                  </h2>
                  <p className="text-muted-foreground font-medium">
                    Describe this word without giving it away too easily. Find the imposter!
                  </p>
                </>
              )}
              
              <div className="absolute top-4 right-4">
                <EyeOff className={`w-6 h-6 ${isImposter ? 'text-white/50' : 'text-black/20'}`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
