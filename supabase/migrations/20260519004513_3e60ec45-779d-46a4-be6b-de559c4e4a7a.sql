
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';
UPDATE public.problems SET categories = ARRAY[category] WHERE array_length(categories,1) IS NULL AND category IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.solution_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid NOT NULL,
  user_id uuid NOT NULL,
  value smallint NOT NULL CHECK (value BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (solution_id, user_id)
);
ALTER TABLE public.solution_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_read_all" ON public.solution_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_own" ON public.solution_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_update_own" ON public.solution_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ratings_delete_own" ON public.solution_ratings FOR DELETE USING (auth.uid() = user_id);
