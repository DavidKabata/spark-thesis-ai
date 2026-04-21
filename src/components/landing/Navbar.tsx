import { Sparkles, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <nav className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-spark blur-md opacity-60 group-hover:opacity-100 transition-smooth" />
            <div className="relative h-8 w-8 rounded-lg bg-spark flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            Scholar<span className="text-gradient-spark">Spark</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/upload" className="hover:text-foreground transition-smooth">Upload</Link>
          <a href="/#features" className="hover:text-foreground transition-smooth">Features</a>
          <a href="/#how" className="hover:text-foreground transition-smooth">How it works</a>
          <a href="/#audience" className="hover:text-foreground transition-smooth">For You</a>
          <a href="/#impact" className="hover:text-foreground transition-smooth">Impact</a>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 shadow-card">
                <Link to="/upload">Upload thesis</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => supabase.auth.signOut()}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-card" asChild>
                <Link to="/auth">Join platform</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
