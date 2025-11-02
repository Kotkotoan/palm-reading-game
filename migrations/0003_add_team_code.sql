-- チームコードカラムを追加（制約なし）
ALTER TABLE teams ADD COLUMN team_code TEXT;

-- 既存チームにランダムなコードを生成（簡易版）
UPDATE teams SET team_code = 'TEAM-' || id WHERE team_code IS NULL;

-- ユニークインデックスを作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_team_code ON teams(team_code);
