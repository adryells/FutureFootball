import type { Team, Round, Match } from "../models";

export function generateRounds(teams: Team[]): Round[] {
  const rounds: Round[] = [];
  const teamCount = teams.length;
  const isOdd = teamCount % 2 !== 0;

  const teamList = [...teams];
  if (isOdd) {
    teamList.push({ id: -1, name: "BYE" });
  }

  const totalRounds = teamList.length - 1;
  const halfSize = teamList.length / 2;

  const teamIds = teamList.map((t) => t.id);

  for (let roundNum = 0; roundNum < totalRounds; roundNum++) {
    const matches: Match[] = [];

    for (let i = 0; i < halfSize; i++) {
      const homeId = teamIds[i];
      const awayId = teamIds[teamIds.length - 1 - i];

      if (homeId !== -1 && awayId !== -1) {
        matches.push({
          id: Date.now() + Math.random(),
          homeTeamId: homeId,
          awayTeamId: awayId,
        });
      }
    }

    teamIds.splice(1, 0, teamIds.pop()!);

    rounds.push({
      id: Date.now() + Math.random(),
      roundNumber: roundNum + 1,
      matches,
    });
  }

  return rounds;
}
