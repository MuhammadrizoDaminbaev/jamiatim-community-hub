import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function NewProblemDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [fullname, setFullname] = useState("");
  const [age, setAge] = useState("");
  const [category, setCategory] = useState("boshqa");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullname.trim() || !problem.trim()) return toast.error("Maydonlarni to'ldiring");
    const ageNum = parseInt(age, 10);
    if (!ageNum || ageNum < 1 || ageNum > 120) return toast.error("Yoshni to'g'ri kiriting");
    setBusy(true);
    const { error } = await supabase.from("problems").insert({
      user_id: user.id,
      fullname: fullname.trim().slice(0, 100),
      age: ageNum,
      category,
      problem: problem.trim().slice(0, 2000),
      solution: solution.trim() ? solution.trim().slice(0, 2000) : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Muammo joylandi");
    setFullname(""); setAge(""); setProblem(""); setSolution(""); setCategory("boshqa");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Muammoyingizni yozing</DialogTitle>
          <DialogDescription>Jamiat sizga yechim topib berishi mumkin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>To'liq ism</Label>
              <Input value={fullname} onChange={(e) => setFullname(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Yosh</Label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kategoriya</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Muammo</Label>
            <Textarea rows={4} value={problem} onChange={(e) => setProblem(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Yechim (ixtiyoriy)</Label>
            <Textarea rows={3} value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Agar yechim topa olmagan bo'lsangiz, bo'sh qoldiring" />
          </div>
          <Button type="submit" className="w-full smooth" disabled={busy}>
            {busy ? "Joylanmoqda..." : "Joylash"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
