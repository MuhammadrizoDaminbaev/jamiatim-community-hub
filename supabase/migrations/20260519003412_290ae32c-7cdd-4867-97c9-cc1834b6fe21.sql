
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Problems
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fullname TEXT NOT NULL,
  age INTEGER NOT NULL,
  category TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "problems_read_all" ON public.problems FOR SELECT USING (true);
CREATE POLICY "problems_insert_auth" ON public.problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "problems_update_own" ON public.problems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "problems_delete_own" ON public.problems FOR DELETE USING (auth.uid() = user_id);

-- Solutions
CREATE TABLE public.solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solutions_read_all" ON public.solutions FOR SELECT USING (true);
CREATE POLICY "solutions_insert_auth" ON public.solutions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "solutions_update_own" ON public.solutions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "solutions_delete_own" ON public.solutions FOR DELETE USING (auth.uid() = user_id);

-- Reactions (likes)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(problem_id, user_id, type)
);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_read_all" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_auth" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON public.reactions FOR DELETE USING (auth.uid() = user_id);
