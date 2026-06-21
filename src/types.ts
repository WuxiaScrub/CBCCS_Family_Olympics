export type ScoringDirection = 'asc' | 'desc'
export type ScoringType = 'points' | 'time'

export interface Team {
  id: string
  name: string
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  name: string
}

export interface Station {
  id: string
  name: string
  sort_order: number
  scoring_type: ScoringType
  direction: ScoringDirection
  created_at: string
}

export interface Score {
  id: string
  station_id: string
  team_id: string
  value: number
  spirit_points: number
  recorded_by: string | null
  recorded_at: string
}

export interface SpiritLeaderboardRow {
  team_id: string
  team_name: string
  total_spirit_points: number
}

export interface StationRankingRow {
  score_id: string
  station_id: string
  team_id: string
  value: number
  spirit_points: number
  place: number
}
