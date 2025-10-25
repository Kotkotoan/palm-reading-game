export type Bindings = {
  DB: D1Database;
}

export interface ApostleType {
  id: number;
  name_ja: string;
  name_en: string;
  description: string;
  characteristics: string;
  strengths: string;
  compatible_types: string;
  icon: string;
  detailed_personality?: string;
  future_2026_2028?: string;
  future_2029_2035?: string;
  future_2036_2050?: string;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  created_at: string;
}

export interface PalmReading {
  id: number;
  user_id: number;
  apostle_type_id: number;
  palm_image_url?: string;
  analysis_data?: string;
  confidence_score?: number;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  apostle_type_id: number;
  joined_at: string;
}

export interface PalmAnalysisResult {
  apostle_type: ApostleType;
  confidence_score: number;
  analysis_details: {
    heart_line: string;
    head_line: string;
    life_line: string;
    fate_line: string;
  };
}
