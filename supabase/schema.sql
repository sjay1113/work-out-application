-- 운동 기록 (한 번 운동 = 한 줄). Supabase SQL Editor에서 한 번 실행했던 내용이에요.
create table public.workouts (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id        text not null,
  start_at  timestamptz not null,
  end_at    timestamptz,
  part      text,
  title     text,
  source    text,
  exercises jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 본인 기록만 읽고 쓰기
alter table public.workouts enable row level security;
create policy "본인 기록 보기"  on public.workouts for select using (auth.uid() = user_id);
create policy "본인 기록 추가"  on public.workouts for insert with check (auth.uid() = user_id);
create policy "본인 기록 수정"  on public.workouts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "본인 기록 삭제"  on public.workouts for delete using (auth.uid() = user_id);

-- DBeaver에서 보기 편하게: 세트 한 줄씩 펼친 보기
create view public.workout_sets with (security_invoker = true) as
select w.user_id, w.id as workout_id, w.start_at, w.part, w.title,
       e.ord as exercise_no, e.ex->>'n' as exercise,
       s.ord as set_no, s.st->>'w' as weight, s.st->>'r' as reps
from public.workouts w
cross join lateral jsonb_array_elements(w.exercises) with ordinality as e(ex, ord)
cross join lateral jsonb_array_elements(e.ex->'sets') with ordinality as s(st, ord);
