import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel } from "@/lib/categories";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

// Admin route accessible only by typing /root/whois in the URL.
export const Route = createFileRoute("/root/whois")({
  component: AdminPage,
});

const STORAGE_KEY = "jamiatim_admin_ok";

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (u === "root" && p === "root") {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
    } else {
      toast.error("Noto'g'ri ma'lumotlar");
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4 p-8 rounded-2xl border bg-card fade-in">
          <h1 className="font-serif text-2xl">root / whois</h1>
          <div className="space-y-2">
            <Label>Login</Label>
            <Input value={u} onChange={(e) => setU(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Parol</Label>
            <Input type="password" value={p} onChange={(e) => setP(e.target.value)} />
          </div>
          <Button type="submit" className="w-full smooth">Kirish</Button>
        </form>
      </div>
    );
  }

  return <AdminPanel onLogout={() => { sessionStorage.removeItem(STORAGE_KEY); setAuthed(false); }} />;
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [problems, setProblems] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, problems: 0, solutions: 0 });

  const load = async () => {
    const [{ data: p }, { count: uc }, { count: sc }] = await Promise.all([
      supabase.from("problems").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("solutions").select("*", { count: "exact", head: true }),
    ]);
    setProblems(p ?? []);
    setStats({ users: uc ?? 0, problems: (p ?? []).length, solutions: sc ?? 0 });
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (error) return toast.error("RLS o'chirishga ruxsat bermadi. Lovable Cloud panelidan o'chiring.");
    toast.success("O'chirildi");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="font-serif text-2xl">Admin — jamiatim</h1>
          <Button variant="ghost" size="sm" onClick={onLogout} className="smooth">Chiqish</Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Foydalanuvchilar" value={stats.users} />
          <Stat label="Muammolar" value={stats.problems} />
          <Stat label="Yechimlar" value={stats.solutions} />
        </div>

        <div className="space-y-3">
          {problems.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-4 flex items-start justify-between gap-4 fade-in">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full">{categoryLabel(p.category)}</span>
                  <span>{new Date(p.created_at).toLocaleString("uz-UZ")}</span>
                </div>
                <p className="font-serif text-lg mt-1">{p.fullname}, {p.age}</p>
                <p className="text-sm mt-1 line-clamp-2">{p.problem}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="smooth text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-serif text-4xl mt-1">{value}</p>
    </div>
  );
}
