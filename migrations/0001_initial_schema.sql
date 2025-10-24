-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 使徒タイプマスターテーブル
CREATE TABLE IF NOT EXISTS apostle_types (
  id INTEGER PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT NOT NULL,
  characteristics TEXT NOT NULL,
  strengths TEXT NOT NULL,
  compatible_types TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- 診断結果テーブル
CREATE TABLE IF NOT EXISTS palm_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  apostle_type_id INTEGER NOT NULL,
  palm_image_url TEXT,
  analysis_data TEXT,
  confidence_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (apostle_type_id) REFERENCES apostle_types(id)
);

-- チームテーブル
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- チームメンバーテーブル
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  apostle_type_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (apostle_type_id) REFERENCES apostle_types(id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_palm_readings_user_id ON palm_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- 12使徒タイプのマスターデータ挿入
INSERT INTO apostle_types (id, name_ja, name_en, description, characteristics, strengths, compatible_types, icon) VALUES
(1, 'ペテロ（リーダー型）', 'Peter - The Leader', '情熱的で決断力のあるリーダー。チームを引っ張る存在', '情熱的、決断力、行動力', 'リーダーシップ、即断即決、チームをまとめる力', '2,3,7', '👑'),
(2, 'ヨハネ（共感型）', 'John - The Empath', '優しく思いやりのある愛の使徒。人の心を理解する', '優しい、思いやり、共感力', '感情理解、癒し、人間関係構築', '1,4,6', '❤️'),
(3, 'アンデレ（サポート型）', 'Andrew - The Supporter', '献身的な縁の下の力持ち。他者を支える', '献身的、協力的、謙虚', 'サポート力、チームワーク、気配り', '1,5,8', '🤝'),
(4, 'ヤコブ（戦略型）', 'James - The Strategist', '計画的で論理的な戦略家。物事を俯瞰する', '計画的、論理的、冷静', '戦略立案、分析力、問題解決', '2,6,9', '🎯'),
(5, 'フィリポ（探求型）', 'Philip - The Explorer', '好奇心旺盛で学習欲の強い探求者', '好奇心、探究心、学習意欲', '情報収集、新発見、知識共有', '3,7,10', '🔍'),
(6, 'バルトロマイ（創造型）', 'Bartholomew - The Creator', '芸術的で独創的なクリエイター', '創造的、芸術的、独創的', 'アイデア創出、デザイン、革新', '2,4,11', '🎨'),
(7, 'マタイ（分析型）', 'Matthew - The Analyst', '細かく正確な分析者。詳細を見逃さない', '几帳面、正確、分析的', 'データ分析、正確性、品質管理', '1,5,12', '📊'),
(8, 'トマス（慎重型）', 'Thomas - The Careful', '疑問を持ち確認する慎重派。リスク管理', '慎重、疑問、確認', 'リスク管理、検証、品質保証', '3,9,10', '🛡️'),
(9, 'ユダ・タダイ（調和型）', 'Jude - The Harmonizer', '平和を愛する調和の使徒。仲裁役', '平和的、調和、仲裁', '調整力、バランス、紛争解決', '4,8,11', '☮️'),
(10, 'シモン（情熱型）', 'Simon - The Passionate', '熱心でエネルギッシュな情熱家', '熱心、エネルギッシュ、熱意', '行動力、モチベーション、推進力', '5,8,12', '🔥'),
(11, '小ヤコブ（忠実型）', 'James the Less - The Faithful', '誠実で真面目な忠実な使徒', '誠実、真面目、忠実', '信頼性、責任感、継続力', '6,9,12', '⭐'),
(12, 'マティア（バランス型）', 'Matthias - The Balanced', '柔軟で適応力のあるバランサー', '柔軟、適応力、バランス', '調整力、多様性理解、統合', '7,10,11', '⚖️');
