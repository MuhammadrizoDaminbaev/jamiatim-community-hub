import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Header({
  onLogin,
  onNew,
}: {
  onLogin: () => void;
  onNew: () => void;
}) {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-3xl smooth hover:opacity-70">
          jamiatim
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button onClick={onNew} size="sm" className="smooth font-medium">Muammo yozish</Button>
              <Button onClick={signOut} variant="ghost" size="sm" className="smooth">Chiqish</Button>
            </>
          ) : (
            <>
              <Button onClick={onNew} variant="outline" size="sm" className="smooth">Muammo yozish</Button>
              <Button onClick={onLogin} size="sm" className="smooth font-medium">Kirish</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
