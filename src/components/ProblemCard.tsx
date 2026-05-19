import { useState } from "react";
import { Heart, MessageCircle, ChevronDown, Star } from "lucide-react";
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
  categories?: string[] | null;
  problem: string;
  solution: string | null;
  created_at: string;
};

export type Rating = { solution_id: string; user_id: string; value: number };

export type Solution = {
  id: string;
  problem_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  ratings?: Rating[];
};

function avg(ratings: Rating[] = []) {
  if (!ratings.length) return 0;
  return ratings.reduce((s, r) => s + r.value, 0) / ratings.length;
}

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

  const cats = problem.categories?.length ? problem.categories : [problem.category];

  const sortedSolutions = [...solutions].sort((a, b) => {
    const da = avg(a.ratings), db = avg(b.ratings);
    if (db !== da) return db - da;
    return (b.ratings?.length ?? 0) - (a.ratings?.length ?? 0);
  });

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

  const rate = async (solId: string, value: number) => {
    if (!user) return onRequireAuth();
    const { error } = await supabase
      .from("solution_ratings" as any)
      .upsert({ solution_id: solId, user_id: user.id, value }, { onConflict: "solution_id,user_id" });
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <article className="rise-in card-hover rounded-2xl border bg-card/90 backdrop-blur p-6 sm:p-7">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-display text-2xl">{problem.fullname}<span className="text-muted-foreground font-normal">, {problem.age}</span></h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(problem.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end max-w-[55%]">
          {cats.map((c) => (
            <span key={c} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
              {categoryLabel(c)}
            </span>
          ))}
        </div>
      </header>

      <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-[15px]">{problem.problem}</p>

      {problem.solution && (
        <div className="mt-5 rounded-xl bg-secondary/70 p-4 border-l-2 border-foreground/30">
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-1.5">Muallif yechimi</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{problem.solution}</p>
        </div>
      )}

      <div className="mt-5 flex items-center gap-1 text-sm text-muted-foreground border-t border-border/60 pt-3">
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
          {sortedSolutions.map((s) => {
            const myVote = user ? s.ratings?.find((r) => r.user_id === user.id)?.value ?? 0 : 0;
            const a = avg(s.ratings);
            return (
              <div key={s.id} className="rounded-xl bg-muted/50 border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">@{s.username ?? "anonim"}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold tabular-nums">
                      {a > 0 ? a.toFixed(1) : "—"}
                      <span className="text-muted-foreground font-normal"> · {s.ratings?.length ?? 0}</span>
                    </span>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3">{s.content}</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => rate(s.id, v)}
                      className="smooth p-1 -m-1 hover:scale-110"
                      title={`${v} / 5`}
                    >
                      <Star
                        className={`h-4 w-4 smooth ${
                          v <= myVote
                            ? "fill-foreground text-foreground"
                            : v <= Math.round(a)
                            ? "fill-foreground/30 text-foreground/40"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-2">
                    {myVote ? "sizning bahoyingiz" : "baholang"}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="space-y-2 pt-1">
            <Textarea
              placeholder="Sizning yechimingiz..."
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => { if (!user) onRequireAuth(); }}
            />
            <Button size="sm" onClick={addSolution} disabled={busy} className="smooth font-medium">
              {busy ? "..." : "Yechim qo'shish"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
