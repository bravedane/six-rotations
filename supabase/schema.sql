-- Six Rotations — database schema
-- Run this whole file once in Supabase: Project > SQL Editor > New query > paste > Run.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).

create extension if not exists pgcrypto;

-- ========== ADMIN EMAIL ==========
-- Set the one admin (Dana's) login email here. Everything else keys off this.
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'hello@danesanders.com';
$$;

-- ========== TABLES ==========

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  uci_email text unique not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists roster_seasons (
  player_id uuid references players(id) on delete cascade,
  season text not null,
  year_in_school text,
  positions jsonb,
  primary key (player_id, season)
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  season text not null,
  checkpoint text not null check (checkpoint in ('preseason','december','postseason')),
  schema_version int not null default 1,
  formula_version int not null default 1,
  submitted_at timestamptz not null default now(),
  source text not null default 'app' check (source in ('app','pasted')),
  answers jsonb not null
);

create table if not exists core_scores (
  checkin_id uuid primary key references checkins(id) on delete cascade,
  agency numeric,
  competence numeric,
  belonging numeric,
  sleep numeric, fuel numeric, water numeric, strength numeric,
  recovery numeric, focus numeric, composure numeric, connection numeric,
  self_team numeric,
  self_future numeric,
  standard_team numeric,
  standard_future numeric,
  gap_team numeric,
  gap_future numeric
);

create table if not exists core_picks (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid references checkins(id) on delete cascade,
  kind text not null check (kind in ('drift','storm')),
  value text not null
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  season text not null,
  habit text not null,
  need text,
  chosen_at text not null default 'preseason',
  december_fit text,
  status text not null default 'kept'
);

create table if not exists appreciations (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid references checkins(id) on delete cascade,
  recipient_name text,
  recipient_role text,
  note text,
  ok_to_share boolean default false,
  delivered_at timestamptz
);

create table if not exists coach_notes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  date date not null default current_date,
  note text not null,
  created_at timestamptz not null default now()
);

-- ========== ROW LEVEL SECURITY ==========
-- Default: nothing is readable until a policy says so.

alter table players enable row level security;
alter table roster_seasons enable row level security;
alter table checkins enable row level security;
alter table core_scores enable row level security;
alter table core_picks enable row level security;
alter table habits enable row level security;
alter table appreciations enable row level security;
alter table coach_notes enable row level security;

-- players: admin sees everyone; a signed-in player sees only his own row
drop policy if exists players_admin_all on players;
create policy players_admin_all on players for all
  using (is_admin()) with check (is_admin());

drop policy if exists players_self_select on players;
create policy players_self_select on players for select
  using (uci_email = coalesce(auth.jwt() ->> 'email', ''));

drop policy if exists players_self_insert on players;
create policy players_self_insert on players for insert
  with check (uci_email = coalesce(auth.jwt() ->> 'email', ''));

-- roster_seasons: admin all; player can see/insert his own
drop policy if exists roster_admin_all on roster_seasons;
create policy roster_admin_all on roster_seasons for all
  using (is_admin()) with check (is_admin());

drop policy if exists roster_self on roster_seasons;
create policy roster_self on roster_seasons for all
  using (player_id in (select id from players where uci_email = coalesce(auth.jwt() ->> 'email','')))
  with check (player_id in (select id from players where uci_email = coalesce(auth.jwt() ->> 'email','')));

-- checkins: admin all; player can see/insert only his own (and only app-sourced inserts)
drop policy if exists checkins_admin_all on checkins;
create policy checkins_admin_all on checkins for all
  using (is_admin()) with check (is_admin());

drop policy if exists checkins_self on checkins;
create policy checkins_self on checkins for all
  using (player_id in (select id from players where uci_email = coalesce(auth.jwt() ->> 'email','')))
  with check (
    player_id in (select id from players where uci_email = coalesce(auth.jwt() ->> 'email',''))
    and source = 'app'
  );

-- core_scores, core_picks: admin only (private standard; players never see teammates or their own standard number)
drop policy if exists scores_admin_all on core_scores;
create policy scores_admin_all on core_scores for all
  using (is_admin()) with check (is_admin());

drop policy if exists picks_admin_all on core_picks;
create policy picks_admin_all on core_picks for all
  using (is_admin()) with check (is_admin());

-- habits: admin all; player can see/manage his own
drop policy if exists habits_admin_all on habits;
create policy habits_admin_all on habits for all
  using (is_admin()) with check (is_admin());

drop policy if exists habits_self on habits;
create policy habits_self on habits for all
  using (player_id in (select id from players where uci_email = coalesce(auth.jwt() ->> 'email','')))
  with check (player_id in (select id from players where uci_email = coalesce(auth.jwt() ->> 'email','')));

-- appreciations: admin only read/write (players submit these as part of a checkin insert handled server-side under player's own session via checkin ownership)
drop policy if exists appreciations_admin_all on appreciations;
create policy appreciations_admin_all on appreciations for all
  using (is_admin()) with check (is_admin());

drop policy if exists appreciations_self_insert on appreciations;
create policy appreciations_self_insert on appreciations for insert
  with check (
    checkin_id in (
      select c.id from checkins c
      join players p on p.id = c.player_id
      where p.uci_email = coalesce(auth.jwt() ->> 'email','')
    )
  );

-- coach_notes: admin only, full stop. No player policy at all.
drop policy if exists notes_admin_all on coach_notes;
create policy notes_admin_all on coach_notes for all
  using (is_admin()) with check (is_admin());

-- ========== HABIT NEED LOOKUP ==========
-- Maps each habit option text (from checkpoints.md / preseason-survey.html) to its need category.
create or replace function habit_need(p_habit text)
returns text
language sql
immutable
as $$
  select case p_habit
    when '2-minute cold shower' then 'Agency'
    when 'Phone out of the bedroom' then 'Agency'
    when 'Plan tomorrow before bed' then 'Agency'
    when 'No social media before noon' then 'Agency'
    when 'Same wake-up time every day' then 'Agency'
    when 'Track one skill: reps and makes' then 'Competence'
    when '100 bodyweight reps a day' then 'Competence'
    when '8 hours in bed, same bedtime' then 'Competence'
    when '10 minutes of mobility before bed' then 'Competence'
    when 'Half your bodyweight in ounces of water' then 'Competence'
    when '5 minutes of breath work before practice' then 'Competence'
    when 'Tell one teammate one specific thing he did well' then 'Belonging'
    when 'Ask a coach one real question a day' then 'Belonging'
    when 'Eat one meal a day phone-free with someone' then 'Belonging'
    when 'One hard conversation a week' then 'Belonging'
    else null
  end;
$$;

-- ========== SCORING ==========
-- Computes core_scores (standard + gap) for a checkin from its answers jsonb.
-- Shared by both submit_checkin (player) and admin_submit_checkin (pasted texts).
create or replace function compute_and_store_scores(p_checkin_id uuid, p_player_id uuid, p_season text, p_checkpoint text, p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency numeric := (p_answers->'sdt'->>'agency')::numeric;
  v_competence numeric := (p_answers->'sdt'->>'competence')::numeric;
  v_belonging numeric := (p_answers->'sdt'->>'belonging')::numeric;
  v_sleep numeric := (p_answers->'scores'->>'sleep')::numeric;
  v_fuel numeric := (p_answers->'scores'->>'fuel')::numeric;
  v_water numeric := (p_answers->'scores'->>'water')::numeric;
  v_strength numeric := (p_answers->'scores'->>'strength')::numeric;
  v_recovery numeric := (p_answers->'scores'->>'recovery')::numeric;
  v_focus numeric := (p_answers->'scores'->>'focus')::numeric;
  v_composure numeric := (p_answers->'scores'->>'composure')::numeric;
  v_connection numeric := (p_answers->'scores'->>'connection')::numeric;
  v_self_team numeric := (p_answers->'self'->>'team')::numeric;
  v_self_future numeric := (p_answers->'self'->>'future')::numeric;
  v_goodday jsonb := coalesce(p_answers->'goodday', '[]'::jsonb);
  v_winpick numeric;
  v_hardwin boolean := v_goodday @> '"Honestly, it''s hard to see a win there"';
  v_team_items numeric[];
  v_future_items numeric[];
  v_fit numeric;
  v_fit_items numeric[] := '{}';
  v_standard_team numeric;
  v_standard_future numeric;
begin
  -- win-when-not-playing score
  if jsonb_array_length(v_goodday) = 0 then
    v_winpick := null;
  elsif v_hardwin then
    v_winpick := 1;
  else
    v_winpick := case jsonb_array_length(v_goodday) when 1 then 3 when 2 then 4 else 5 end;
  end if;

  v_team_items := array_remove(array[v_belonging, v_connection, v_winpick], null);
  v_standard_team := case when array_length(v_team_items,1) > 0
    then round((select avg(x) from unnest(v_team_items) x)::numeric, 1) else null end;

  v_future_items := array_remove(array[v_agency, v_competence, v_sleep, v_fuel, v_water, v_strength, v_recovery, v_focus, v_composure], null);

  -- habit fit (december/postseason only): map each chosen habit's december_fit for this player+season
  if p_checkpoint in ('december','postseason') then
    select array_agg(
      case h.december_fit
        when 'It''s part of me now' then 5
        when 'On and off' then 3
        when 'It slipped away' then 1
        else null
      end
    ) filter (where h.december_fit is not null)
    into v_fit_items
    from habits h
    where h.player_id = p_player_id and h.season = p_season;
    if v_fit_items is not null then
      v_future_items := v_future_items || v_fit_items;
    end if;
  end if;

  v_standard_future := case when array_length(v_future_items,1) > 0
    then round((select avg(x) from unnest(v_future_items) x)::numeric, 1) else null end;

  insert into core_scores (checkin_id, agency, competence, belonging, sleep, fuel, water, strength, recovery, focus, composure, connection,
    self_team, self_future, standard_team, standard_future, gap_team, gap_future)
  values (p_checkin_id, v_agency, v_competence, v_belonging, v_sleep, v_fuel, v_water, v_strength, v_recovery, v_focus, v_composure, v_connection,
    v_self_team, v_self_future, v_standard_team, v_standard_future,
    case when v_self_team is not null and v_standard_team is not null then round(v_self_team - v_standard_team, 1) else null end,
    case when v_self_future is not null and v_standard_future is not null then round(v_self_future - v_standard_future, 1) else null end)
  on conflict (checkin_id) do update set
    agency=excluded.agency, competence=excluded.competence, belonging=excluded.belonging,
    sleep=excluded.sleep, fuel=excluded.fuel, water=excluded.water, strength=excluded.strength,
    recovery=excluded.recovery, focus=excluded.focus, composure=excluded.composure, connection=excluded.connection,
    self_team=excluded.self_team, self_future=excluded.self_future,
    standard_team=excluded.standard_team, standard_future=excluded.standard_future,
    gap_team=excluded.gap_team, gap_future=excluded.gap_future;

  -- core_picks: drift + storms
  delete from core_picks where checkin_id = p_checkin_id;
  insert into core_picks (checkin_id, kind, value)
  select p_checkin_id, 'drift', jsonb_array_elements_text(coalesce(p_answers->'drift','[]'::jsonb));
  insert into core_picks (checkin_id, kind, value)
  select p_checkin_id, 'storm', jsonb_array_elements_text(coalesce(p_answers->'storms','[]'::jsonb));

  -- habits chosen (preseason only creates new rows; december updates fit/status on existing)
  if p_checkpoint = 'preseason' then
    insert into habits (player_id, season, habit, need, chosen_at, status)
    select p_player_id, p_season, h, habit_need(h), 'preseason', 'kept'
    from jsonb_array_elements_text(coalesce(p_answers->'habits','[]'::jsonb)) h
    where not exists (
      select 1 from habits existing where existing.player_id = p_player_id and existing.season = p_season and existing.habit = h
    );
  end if;
end;
$$;

-- ========== SUBMIT: PLAYER (authenticated, own email only) ==========
create or replace function submit_checkin(p_checkpoint text, p_season text, p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_player_id uuid;
  v_checkin_id uuid;
begin
  if v_email = '' then
    raise exception 'not authenticated';
  end if;
  if p_checkpoint not in ('preseason','december','postseason') then
    raise exception 'invalid checkpoint';
  end if;

  insert into players (uci_email, name)
  values (v_email, p_answers->>'name')
  on conflict (uci_email) do update set name = coalesce(excluded.name, players.name)
  returning id into v_player_id;

  insert into roster_seasons (player_id, season, year_in_school, positions)
  values (v_player_id, p_season, (p_answers->'year'->>0), coalesce(p_answers->'position','[]'::jsonb))
  on conflict (player_id, season) do update set
    year_in_school = coalesce(excluded.year_in_school, roster_seasons.year_in_school),
    positions = coalesce(excluded.positions, roster_seasons.positions);

  insert into checkins (player_id, season, checkpoint, schema_version, submitted_at, source, answers)
  values (v_player_id, p_season, p_checkpoint, coalesce((p_answers->>'schema_version')::int,1), now(), 'app', p_answers)
  returning id into v_checkin_id;

  perform compute_and_store_scores(v_checkin_id, v_player_id, p_season, p_checkpoint, p_answers);

  return v_checkin_id;
end;
$$;

revoke all on function submit_checkin(text, text, jsonb) from public;
grant execute on function submit_checkin(text, text, jsonb) to authenticated;

-- ========== SUBMIT: ADMIN (for pasted texted-in answers) ==========
create or replace function admin_submit_checkin(p_player_email text, p_checkpoint text, p_season text, p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_player_email));
  v_player_id uuid;
  v_checkin_id uuid;
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if v_email !~* '^[^@\s]+@uci\.edu$' then
    raise exception 'player email must be a uci.edu address';
  end if;
  if p_checkpoint not in ('preseason','december','postseason') then
    raise exception 'invalid checkpoint';
  end if;

  insert into players (uci_email, name)
  values (v_email, p_answers->>'name')
  on conflict (uci_email) do update set name = coalesce(excluded.name, players.name)
  returning id into v_player_id;

  insert into roster_seasons (player_id, season, year_in_school, positions)
  values (v_player_id, p_season, (p_answers->'year'->>0), coalesce(p_answers->'position','[]'::jsonb))
  on conflict (player_id, season) do update set
    year_in_school = coalesce(excluded.year_in_school, roster_seasons.year_in_school),
    positions = coalesce(excluded.positions, roster_seasons.positions);

  insert into checkins (player_id, season, checkpoint, schema_version, submitted_at, source, answers)
  values (v_player_id, p_season, p_checkpoint, coalesce((p_answers->>'schema_version')::int,1), now(), 'pasted', p_answers)
  returning id into v_checkin_id;

  perform compute_and_store_scores(v_checkin_id, v_player_id, p_season, p_checkpoint, p_answers);

  return v_checkin_id;
end;
$$;

revoke all on function admin_submit_checkin(text, text, text, jsonb) from public;
grant execute on function admin_submit_checkin(text, text, text, jsonb) to authenticated;

-- ========== DONE ==========
-- After running this, go to Authentication > Providers and make sure Email is enabled
-- with "Confirm email" off and magic link / OTP on (default Supabase behavior).
