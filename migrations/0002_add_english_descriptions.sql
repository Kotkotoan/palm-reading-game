-- 英語版フィールドを追加
ALTER TABLE apostle_types ADD COLUMN description_en TEXT;
ALTER TABLE apostle_types ADD COLUMN description_ja TEXT;
ALTER TABLE apostle_types ADD COLUMN characteristics_en TEXT;
ALTER TABLE apostle_types ADD COLUMN characteristics_ja TEXT;
ALTER TABLE apostle_types ADD COLUMN strengths_en TEXT;
ALTER TABLE apostle_types ADD COLUMN strengths_ja TEXT;

-- 既存データを日本語フィールドにコピー
UPDATE apostle_types SET description_ja = description;
UPDATE apostle_types SET characteristics_ja = characteristics;
UPDATE apostle_types SET strengths_ja = strengths;

-- 英語版データを更新
UPDATE apostle_types SET 
  description_en = 'Passionate and decisive leader. A driving force for the team',
  characteristics_en = 'Passionate, decisive, action-oriented',
  strengths_en = 'Leadership, quick decision-making, team building'
WHERE id = 1;

UPDATE apostle_types SET 
  description_en = 'Kind and compassionate apostle of love. Understanding hearts',
  characteristics_en = 'Kind, compassionate, empathetic',
  strengths_en = 'Emotional intelligence, healing, relationship building'
WHERE id = 2;

UPDATE apostle_types SET 
  description_en = 'Devoted supporter behind the scenes. Supporting others',
  characteristics_en = 'Devoted, cooperative, humble',
  strengths_en = 'Support skills, teamwork, attentiveness'
WHERE id = 3;

UPDATE apostle_types SET 
  description_en = 'Planned and logical strategist. Seeing the big picture',
  characteristics_en = 'Planned, logical, calm',
  strengths_en = 'Strategic planning, analytical skills, problem-solving'
WHERE id = 4;

UPDATE apostle_types SET 
  description_en = 'Curious explorer with strong learning desire',
  characteristics_en = 'Curious, inquisitive, eager to learn',
  strengths_en = 'Information gathering, discovery, knowledge sharing'
WHERE id = 5;

UPDATE apostle_types SET 
  description_en = 'Artistic and original creator',
  characteristics_en = 'Creative, artistic, original',
  strengths_en = 'Idea generation, design, innovation'
WHERE id = 6;

UPDATE apostle_types SET 
  description_en = 'Detailed and accurate analyst. Never missing details',
  characteristics_en = 'Meticulous, accurate, analytical',
  strengths_en = 'Data analysis, precision, quality control'
WHERE id = 7;

UPDATE apostle_types SET 
  description_en = 'Cautious questioner and verifier. Risk management',
  characteristics_en = 'Cautious, questioning, verifying',
  strengths_en = 'Risk management, verification, quality assurance'
WHERE id = 8;

UPDATE apostle_types SET 
  description_en = 'Peace-loving harmonizer. The mediator',
  characteristics_en = 'Peaceful, harmonious, mediating',
  strengths_en = 'Coordination, balance, conflict resolution'
WHERE id = 9;

UPDATE apostle_types SET 
  description_en = 'Enthusiastic and energetic passionate person',
  characteristics_en = 'Enthusiastic, energetic, passionate',
  strengths_en = 'Action-oriented, motivation, driving force'
WHERE id = 10;

UPDATE apostle_types SET 
  description_en = 'Honest and serious faithful apostle',
  characteristics_en = 'Honest, serious, faithful',
  strengths_en = 'Reliability, responsibility, persistence'
WHERE id = 11;

UPDATE apostle_types SET 
  description_en = 'Flexible and adaptable balancer',
  characteristics_en = 'Flexible, adaptable, balanced',
  strengths_en = 'Adjustment skills, diversity understanding, integration'
WHERE id = 12;
