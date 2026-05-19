import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { NewProblemDialog } from "@/components/NewProblemDialog";
import { ProblemCard, type Problem, type Solution, type Rating } from "@/components/ProblemCard";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [reactions, setReactions] = useState<{ problem_id: string; user_id: string }[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    const [{ data: p }, { data: r }, { data: s }, { data: rt }] = await Promise.all([
      supabase.from("problems").select("*").order("created_at", { ascending: false }),
      supabase.from("reactions").select("problem_id, user_id").eq("type", "like"),
      supabase.from("solutions").select("*").order("created_at", { ascending: true }),
      supabase.from("solution_ratings" as any).select("solution_id, user_id, value"),
    ]);
    const userIds = Array.from(new Set((s ?? []).map((x: any) => x.user_id)));
    let profMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", userIds);
      profMap = new Map((profs ?? []).map((pr: any) => [pr.id, pr.username]));
    }
    const ratingsMap = new Map<string, Rating[]>();
    for (const x of (rt ?? []) as any[]) {
      const list = ratingsMap.get(x.solution_id) ?? [];
      list.push(x);
      ratingsMap.set(x.solution_id, list);
    }
    setProblems((p ?? []) as Problem[]);
    setReactions((r ?? []) as any);
    setSolutions(((s ?? []) as any).map((x: any) => ({
      ...x,
      username: profMap.get(x.user_id) ?? "anonim",
      ratings: ratingsMap.get(x.id) ?? [],
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const requireAuth = () => setAuthOpen(true);
  const requireAuthThenNew = () => (user ? setNewOpen(true) : setAuthOpen(true));

  const likeMap = useMemo(() => {
    const m = new Map<string, { count: number; liked: boolean }>();
    for (const r of reactions) {
      const cur = m.get(r.problem_id) ?? { count: 0, liked: false };
      cur.count++;
      if (user && r.user_id === user.id) cur.liked = true;
      m.set(r.problem_id, cur);
    }
    return m;
  }, [reactions, user]);

  const solMap = useMemo(() => {
    const m = new Map<string, Solution[]>();
    for (const s of solutions) {
      const list = m.get(s.problem_id) ?? [];
      list.push(s);
      m.set(s.problem_id, list);
    }
    return m;
  }, [solutions]);

  const filtered = filter === "all"
    ? problems
    : problems.filter((p) => (p.categories?.length ? p.categories.includes(filter) : p.category === filter));

  return (
    <div className="min-h-screen">
      <Header onLogin={() => setAuthOpen(true)} onNew={requireAuthThenNew} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <section className="mb-12 rise-in">
          <h1 className="font-display text-5xl sm:text-6xl">
            Jamiat sizga<br/>
            <span className="italic font-medium">yechim</span> topadi.
          </h1>
          <p className="mt-5 text-muted-foreground max-w-xl text-base sm:text-lg leading-relaxed">
            Muammoyingizni yozing. Yechim bo'lsa ham, bo'lmasa ham —
            boshqalar o'z tajribasi bilan yordam beradi.
          </p>
        </section>

        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Hammasi</FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </FilterChip>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Yuklanmoqda...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border/70 bg-card/40">
            <p className="font-display text-3xl mb-2">Hali muammolar yo'q</p>
            <p className="text-muted-foreground mb-5">Birinchi bo'lib yozing.</p>
            <Button onClick={requireAuthThenNew} className="smooth font-medium">Muammo yozish</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((p) => (
              <ProblemCard
                key={p.id}
                problem={p}
                likes={likeMap.get(p.id)?.count ?? 0}
                liked={likeMap.get(p.id)?.liked ?? false}
                solutions={solMap.get(p.id) ?? []}
                onRequireAuth={requireAuth}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-10 text-center text-xs text-muted-foreground">
        <span className="font-serif italic">jamiatim</span> — jamiat so'zidan
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <NewProblemDialog open={newOpen} onOpenChange={setNewOpen} onCreated={load} />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`smooth px-4 py-1.5 rounded-full text-sm font-medium border ${
        active
          ? "bg-foreground text-background border-foreground shadow-sm"
          : "bg-card/70 hover:bg-accent border-border/70"
      }`}
    >
      {children}
    </button>
  );
}
