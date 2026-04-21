-- Migration: 회비 장부 + 팀 매칭 신청
-- Supabase SQL Editor에서 실행하세요

-- ── 회비 장부 ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id   uuid REFERENCES players(id) ON DELETE SET NULL,
  player_name text NOT NULL,
  month       text NOT NULL,  -- 'YYYY-MM'
  amount      int  NOT NULL DEFAULT 30000,
  paid        boolean NOT NULL DEFAULT false,
  paid_at     timestamptz,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- 같은 달에 같은 선수 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS dues_team_player_month
  ON dues (team_id, player_id, month)
  WHERE player_id IS NOT NULL;

ALTER TABLE dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dues: team members only" ON dues
  FOR ALL USING (team_id = my_team_id());

-- ── 팀 매칭 신청 ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_challenges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_team_id   uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  requester_team_name text NOT NULL,
  target_team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  target_team_name    text NOT NULL,
  proposed_date       timestamptz,
  location            text,
  message             text,
  status              text NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges: involved teams only" ON team_challenges
  FOR ALL USING (
    requester_team_id = my_team_id() OR target_team_id = my_team_id()
  );

-- 팀 검색을 위해 teams 테이블을 로그인한 사용자에게 공개
-- (기존 RLS가 없는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'teams: searchable'
  ) THEN
    CREATE POLICY "teams: searchable" ON teams FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
