import { CreateRoomModal } from "@/components/CreateRoomModal";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Ghost, Users, Plus } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="inline-block p-4 rounded-3xl bg-white shadow-xl shadow-primary/10 mb-6 animate-float">
          <Ghost className="w-16 h-16 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-6xl font-black font-display tracking-tight text-foreground mb-2">
          Imposter
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-xs mx-auto">
          The party game of hidden roles and secrets.
        </p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4 relative z-10">
        <CreateRoomModal 
          trigger={
            <Button className="w-full h-20 text-xl font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/90 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300">
              <Plus className="mr-3 h-7 w-7" />
              Create Game
            </Button>
          } 
        />
        
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-muted-foreground font-medium text-sm">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <JoinRoomModal 
          trigger={
            <Button variant="outline" className="w-full h-20 text-xl font-bold rounded-2xl border-2 hover:bg-secondary/5 hover:border-secondary hover:text-secondary shadow-lg hover:shadow-xl transition-all duration-300">
              <Users className="mr-3 h-7 w-7" />
              Join Game
            </Button>
          } 
        />
      </div>

      <footer className="absolute bottom-6 text-center w-full text-muted-foreground/60 text-sm font-medium">
        Play locally with friends
      </footer>
    </div>
  );
}
