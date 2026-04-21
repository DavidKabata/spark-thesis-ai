-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  canvas_type TEXT NOT NULL CHECK (canvas_type IN ('business_model', 'lean')),
  file_path TEXT,
  executive_summary TEXT,
  value_create TEXT,
  value_deliver TEXT,
  value_capture TEXT,
  canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own analyses" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own analyses" ON public.analyses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own analyses" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER analyses_set_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX analyses_user_id_idx ON public.analyses(user_id, created_at DESC);

-- Storage bucket for theses (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('theses', 'theses', false);

CREATE POLICY "Users upload own theses" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'theses' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users read own theses" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'theses' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users delete own theses" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'theses' AND auth.uid()::text = (storage.foldername(name))[1]
  );