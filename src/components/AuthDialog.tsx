import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { loginOrSignup } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) return toast.error("Username kamida 3 ta belgi");
    if (password.length < 6) return toast.error("Parol kamida 6 ta belgi");
    setBusy(true);
    try {
      await loginOrSignup(username, password);
      toast.success("Xush kelibsiz");
      onOpenChange(false);
      setUsername("");
      setPassword("");
    } catch (err: any) {
      toast.error(err.message ?? "Xatolik");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Jamiatimga kirish</DialogTitle>
          <DialogDescription>
            Username va parolingizni kiriting. Yangi bo'lsangiz, hisob avtomatik yaratiladi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u">Username</Label>
            <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p">Parol</Label>
            <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full smooth" disabled={busy}>
            {busy ? "Kutilmoqda..." : "Kirish / Ro'yxatdan o'tish"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
