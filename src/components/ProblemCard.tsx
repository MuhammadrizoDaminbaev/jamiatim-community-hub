import { useState } from "react";
import { Heart, MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categoryLabel } from "@/lib/categories";
import { toast } from "sonner";

export type Problem = {
  id: string;
  user_id: string;
  fullname: string;
  age: number;
  category: string;
  problem: string;
  solution: string | null;
  created_at: string;
};

export type Solution = {
  id: string;
  problem_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
};

export function ProblemCard({
  problem,
  likes,
  liked,
  solutions,
  onRequireAuth,
  onChanged,
}: {
  problem: Problem;
  likes: number;
  liked: boolean;
  solutions: Solution[];
  onRequireAuth: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
    if (!user) return onRequireAuth();
    if (liked) {
      await supabase.from("reactions")
        .delete()
        .eq("problem_id", problem.id)
        .eq("user_id", user.id)
        .eq("type", "like");
    } else {
      await supabase.from("reactions").insert({
        problem_id: problem.id, user_id: user.id, type: "like",
      });
    }
    onChanged();
  };

  const addSolution = async () => {
    if (!user) return onRequireAuth();
    if (text.trim().length < 3) return toast.error("Yechim juda qisqa");
    setBusy(true);
    const { error } = await supabase.from("solutions").insert({
      problem_id: problem.id, user_id: user.id, content: text.trim().slice(0, 2000),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setText("");
    toast.success("Yechim qo'shildi");
    onChanged();
  };

  return (
    <article className="fade-in card-hover rounded-2xl border bg-card p-6">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-xl leading-tight">{problem.fullname}, {problem.age}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(problem.created_at).toLocaleDateString("uz-UZ")}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
          {categoryLabel(problem.category)}
        </span>
      </header>

      <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{problem.problem}</p>

      {problem.solution && (
        <div className="mt-4 rounded-xl bg-secondary p-4 border-l-2 border-foreground/20">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Muallif yechimi</p>
          <p className="whitespace-pre-wrap text-sm">{problem.solution}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost" size="sm"
          onClick={toggleLike}
          className={`smooth gap-1.5 ${liked ? "text-destructive" : ""}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likes}
        </Button>
        <Button
          variant="ghost" size="sm"
          onClick={() => setOpen((v) => !v)}
          className="smooth gap-1.5"
        >
          <MessageCircle className="h-4 w-4" />
          {solutions.length} yechim
          <ChevronDown className={`h-3.5 w-3.5 smooth ${open ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 fade-in">
          {solutions.map((s) => (
            <div key={s.id} className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground mb-1">@{s.username ?? "anonim"}</p>
              <p className="text-sm whitespace-pre-wrap">{s.content}</p>
            </div>
          ))}
          <div className="space-y-2">
            <Textarea
              placeholder="Sizning yechimingiz..."
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => { if (!user) onRequireAuth(); }}
            />
            <Button size="sm" onClick={addSolution} disabled={busy} className="smooth">
              {busy ? "..." : "Yechim qo'shish"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
