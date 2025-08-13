// /shared/models.ts
export interface Team {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore?: number; // undefined => não jogado ainda
  awayScore?: number;
}

export interface Round {
  id: number;
  roundNumber: number;
  matches: Match[];
}

export interface League {
  id: number;
  name: string;
  year: number;
  teams: Team[];
  rounds: Round[];
}

export interface Standing {
  teamId: number;
  teamName: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winPercentage: number;
}
