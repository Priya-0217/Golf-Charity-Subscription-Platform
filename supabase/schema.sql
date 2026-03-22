-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
END$$;

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive',
  charity_id UUID, -- Selected charity
  contribution_percent INTEGER DEFAULT 10, -- Min 10%
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profiles columns have required UNIQUE constraints for ON CONFLICT support
DO $$
BEGIN
    -- id (Primary Key)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND contype = 'p') THEN
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
    END IF;
    
    -- email
    IF NOT EXISTS (
        SELECT 1 FROM pg_index i 
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.profiles'::regclass AND a.attname = 'email' AND i.indisunique
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;

    -- stripe_customer_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_index i 
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.profiles'::regclass AND a.attname = 'stripe_customer_id' AND i.indisunique
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_stripe_customer_id_unique UNIQUE (stripe_customer_id);
    END IF;
END$$;

-- CHARITIES
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  total_raised DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure charities.name is UNIQUE for ON CONFLICT support
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_index i 
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.charities'::regclass AND a.attname = 'name' AND i.indisunique
    ) THEN
        ALTER TABLE public.charities ADD CONSTRAINT charities_name_unique UNIQUE (name);
    END IF;
END$$;

-- Add foreign key to profiles after charities table is created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_charity') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT fk_charity FOREIGN KEY (charity_id) REFERENCES public.charities(id);
    END IF;
END$$;

-- SUBSCRIPTIONS (Mirrors Stripe status)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL, -- 'monthly' or 'yearly'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', etc.
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCORES
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 45) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRAWS
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'simulated', 'published'
  prize_pool_3 DECIMAL DEFAULT 0,
  prize_pool_4 DECIMAL DEFAULT 0,
  prize_pool_5 DECIMAL DEFAULT 0,
  jackpot_rollover DECIMAL DEFAULT 0,
  winning_numbers INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WINNERS
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  match_tier INTEGER NOT NULL, -- 3, 4, or 5
  prize_amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'verified', 'rejected'
  proof_url TEXT, -- Image proof
  payout_status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRIBUTIONS
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL NOT NULL,
  contribution_percent INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTIONS & TRIGGERS
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Golfer'), 
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN new.email = 'prilgupta017@gmail.com' THEN 'admin'::user_role ELSE 'user'::user_role END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Charities: Everyone can view active charities
DROP POLICY IF EXISTS "Public charities are viewable by everyone" ON public.charities;
CREATE POLICY "Public charities are viewable by everyone" ON public.charities FOR SELECT USING (is_active = true);

-- Profiles: Users can view, update and insert their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Scores: Users can view and insert their own scores
DROP POLICY IF EXISTS "Users can view their own scores" ON public.scores;
CREATE POLICY "Users can view their own scores" ON public.scores FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own scores" ON public.scores;
CREATE POLICY "Users can insert their own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own scores" ON public.scores;
CREATE POLICY "Users can delete their own scores" ON public.scores FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions: Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Winners: Users can view their own winnings
DROP POLICY IF EXISTS "Users can view their own winnings" ON public.winners;
CREATE POLICY "Users can view their own winnings" ON public.winners FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own winnings" ON public.winners;
CREATE POLICY "Users can update their own winnings" ON public.winners FOR UPDATE USING (auth.uid() = user_id); -- For uploading proof

-- Draws: Everyone can view published draws
DROP POLICY IF EXISTS "Published draws are viewable by everyone" ON public.draws;
CREATE POLICY "Published draws are viewable by everyone" ON public.draws FOR SELECT USING (status = 'published');

-- Admin Policies (Access to all data for admins)
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (
  public.is_admin()
);
DROP POLICY IF EXISTS "Admins have full access to charities" ON public.charities;
CREATE POLICY "Admins have full access to charities" ON public.charities FOR ALL USING (
  public.is_admin()
);
DROP POLICY IF EXISTS "Admins have full access to draws" ON public.draws;
CREATE POLICY "Admins have full access to draws" ON public.draws FOR ALL USING (
  public.is_admin()
);
DROP POLICY IF EXISTS "Admins have full access to winners" ON public.winners;
CREATE POLICY "Admins have full access to winners" ON public.winners FOR ALL USING (
  public.is_admin()
);

-- Contributions: Users can view their own contributions
DROP POLICY IF EXISTS "Users can view their own contributions" ON public.contributions;
CREATE POLICY "Users can view their own contributions" ON public.contributions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to contributions" ON public.contributions;
CREATE POLICY "Admins have full access to contributions" ON public.contributions FOR ALL USING (
  public.is_admin()
);

-- SAMPLE DATA (Idempotent without ON CONFLICT)
INSERT INTO public.charities (name, description, logo_url, is_active)
SELECT 'Green Fairways Foundation', 'Supporting youth golf programs in underprivileged communities.', 'https://placehold.co/100x100?text=GFF', true
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE name = 'Green Fairways Foundation');

INSERT INTO public.charities (name, description, logo_url, is_active)
SELECT 'Ocean Clean Golf', 'Cleaning coastal golf courses and protecting marine life.', 'https://placehold.co/100x100?text=OCG', true
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE name = 'Ocean Clean Golf');

-- GRANT ADMIN STATUS (Run this in the SQL editor for your account)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'prilgupta017@gmail.com';
