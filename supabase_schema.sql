-- Create food logs table
create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  food_name text not null,
  quantity numeric not null,
  unit text not null,
  meal text not null,
  logged_at timestamp with time zone default now(),
  usda_fdc_id text,
  calories numeric default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  fiber_g numeric default 0,
  sodium_mg numeric default 0,
  vitamin_a_mcg numeric default 0,
  vitamin_c_mg numeric default 0,
  vitamin_d_mcg numeric default 0,
  calcium_mg numeric default 0,
  iron_mg numeric default 0,
  potassium_mg numeric default 0
);

-- Enable Row Level Security (RLS) for food_logs
alter table food_logs enable row level security;

-- Create policy for food_logs (users can access only their own rows)
create policy "Users can manage their own food logs"
  on food_logs for all
  using (auth.uid() = user_id);

-- Create user goals table
create table if not exists user_goals (
  user_id uuid references auth.users primary key,
  daily_calories numeric default 2000,
  daily_protein_g numeric default 150,
  daily_carbs_g numeric default 200,
  daily_fat_g numeric default 65
);

-- Enable Row Level Security (RLS) for user_goals
alter table user_goals enable row level security;

-- Create policy for user_goals (users can access only their own rows)
create policy "Users can manage their own goals"
  on user_goals for all
  using (auth.uid() = user_id);
