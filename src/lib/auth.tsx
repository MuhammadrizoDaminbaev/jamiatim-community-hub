import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_DOMAIN = "jamiatim.local";
const toEmail = (username: string) =>
  `${username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")}@${EMAIL_DOMAIN}`;

type Profile = { id: string; username: string };

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loginOrSignup: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(async () => {
          const { data } = await supabase
            .from("profiles")
            .select("id, username")
            .eq("id", s.user.id)
            .maybeSingle();
          setProfile(data as Profile | null);
        }, 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loginOrSignup = async (username: string, password: string) => {
    const email = toEmail(username);
    const login = await supabase.auth.signInWithPassword({ email, password });
    if (login.error) {
      // Try signup
      const signup = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim() } },
      });
      if (signup.error) throw new Error(signup.error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, profile, loading, loginOrSignup, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
};
