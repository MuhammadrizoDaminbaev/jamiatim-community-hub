import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { NewProblemDialog } from "@/components/NewProblemDialog";
import { ProblemCard, type Problem, type Solution } from "@/components/ProblemCard";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [reactions, setReactions] = useState<{ problem_id: string; user_id: string }[]>([]);
  const [solutions, setSolutions] = useState<(Solution & { profiles?: { username: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    const [{ data: p }, { data: r }, { data: s }] = await Promise.all([
      supabase.from("problems").select("*").order("created_at", { ascending: false }),
      supabase.from("reactions").select("problem_id, user_id").eq("type", "like"),
      supabase.from("solutions").select("*").order("created_at", { ascending: true }),
    ]);
    const userIds = Array.from(new Set((s ?? []).map((x: any) => x.user_id)));
    let profMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", userIds);
      profMap = new Map((profs ?? []).map((pr: any) => [pr.id, pr.username]));
    }
    setProblems((p ?? []) as Problem[]);
    setReactions((r ?? []) as any);
    setSolutions(((s ?? []) as any).map((x: any) => ({ ...x, profiles: { username: profMap.get(x.user_id) ?? "anonim" } })));
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
      list.push({ ...s, username: (s as any).profiles?.username });
      m.set(s.problem_id, list);
    }
    return m;
  }, [solutions]);

  const filtered = filter === "all" ? problems : problems.filter((p) => p.category === filter);

  return (
    <div className="min-h-screen bg-background">
      <Header onLogin={() => setAuthOpen(true)} onNew={requireAuthThenNew} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <section className="mb-10 fade-in">
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight">
            Jamiat sizga yechim topadi.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Muammoyingizni yozing. Yechim bo'lsa ham, bo'lmasa ham — boshqalar
            o'z tajribasi bilan yordam beradi.
          </p>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
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
          <div className="text-center py-16 rounded-2xl border border-dashed">
            <p className="font-serif text-2xl mb-2">Hali muammolar yo'q</p>
            <p className="text-muted-foreground mb-4">Birinchi bo'lib yozing.</p>
            <Button onClick={requireAuthThenNew} className="smooth">Muammo yozish</Button>
          </div>
        ) : (
          <div className="space-y-4">
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
        jamiatim — jamiat so'zidan
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
      className={`smooth px-3.5 py-1.5 rounded-full text-sm border ${
        active ? "bg-foreground text-background border-foreground" : "bg-card hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
