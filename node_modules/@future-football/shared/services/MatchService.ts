// /shared/services/matchService.ts
import type { League } from "../models";

export function updateMatchScore(
  league: League,
  matchId: number,
  homeScore: number,
  awayScore: number
): League {
  return {
    ...league,
    rounds: league.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) =>
        m.id === matchId
          ? { ...m, homeScore, awayScore }
          : m
      ),
    })),
  };
}
