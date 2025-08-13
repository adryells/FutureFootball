import type { League, Standing } from "../models";

export function calculateStandings(league: League): Standing[] {
  const standingsMap = new Map<number, Standing>();

  for (const team of league.teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      points: 0,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      winPercentage: 0,
    });
  }

  for (const round of league.rounds) {
    for (const match of round.matches) {
      if (match.homeScore === undefined || match.awayScore === undefined) {
        continue; 
      }

      const home = standingsMap.get(match.homeTeamId)!;
      const away = standingsMap.get(match.awayTeamId)!;

      home.gamesPlayed++;
      away.gamesPlayed++;

      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.wins++;
        home.points += 3;
        away.losses++;
      } else if (match.homeScore < match.awayScore) {
        away.wins++;
        away.points += 3;
        home.losses++;
      } else {
        home.draws++;
        away.draws++;
        home.points++;
        away.points++;
      }
    }
  }

  for (const standing of standingsMap.values()) {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
    standing.winPercentage = standing.gamesPlayed
      ? (standing.wins / standing.gamesPlayed) * 100
      : 0;
  }

  return Array.from(standingsMap.values()).sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor
  );
}
