import { useEffect, useState } from "react";
import { db } from "../db";
import type { League, Team } from "../../../../shared/models";
import { generateRounds } from "../../../../shared/services/scheduleService";
import { calculateStandings } from "../../../../shared/services/StandingsService";
import { updateMatchScore } from "../../../../shared/services/matchService";

export default function Home() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueYear, setNewLeagueYear] = useState<number>(2025);
  const [newTeams, setNewTeams] = useState<Team[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);

  useEffect(() => {
    db.leagues.toArray().then(setLeagues);
  }, []);

  const addTeam = (name: string) => {
    setNewTeams([...newTeams, { id: Date.now(), name }]);
  };

  const createLeague = async () => {
    const rounds = generateRounds(newTeams);
    const newLeague: League = {
      id: Date.now(),
      name: newLeagueName,
      year: newLeagueYear,
      teams: newTeams,
      rounds
    };
    await db.leagues.add(newLeague);
    setLeagues([...leagues, newLeague]);
    setCurrentLeague(newLeague);
  };

const handleScoreChange = async (matchId: number, home: number, away: number) => {
  if (!currentLeague) return;

  const updatedLeague = updateMatchScore(currentLeague, matchId, home, away);

  try {
    await db.leagues.put(updatedLeague);

    setCurrentLeague(updatedLeague);

    setLeagues(prev =>
      prev.map(l => (l.id === updatedLeague.id ? updatedLeague : l))
    );
  } catch (error) {
    console.error("Erro ao salvar placar:", error);
  }
};


  return (
    <div style={{ padding: 20 }}>
      {!currentLeague && (
        <>
          <h1>Campeonatos</h1>
          {leagues.length === 0 && <p>Nenhum campeonato criado.</p>}
          <ul>
            {leagues.map((l) => (
              <li key={l.id} onClick={() => setCurrentLeague(l)}>
                {l.name} ({l.year})
              </li>
            ))}
          </ul>

          <h2>Criar novo campeonato</h2>
          <input
            placeholder="Nome"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
          />
          <input
            type="number"
            value={newLeagueYear}
            onChange={(e) => setNewLeagueYear(Number(e.target.value))}
          />
          <h3>Times</h3>
          <input
            placeholder="Nome do time"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addTeam((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <ul>
            {newTeams.map((t) => (
              <li key={t.id}>{t.name}</li>
            ))}
          </ul>
          {newTeams.length >= 3 && (
            <button onClick={createLeague}>Criar campeonato</button>
          )}
        </>
      )}

      {currentLeague && (
        <>
          <button onClick={() => setCurrentLeague(null)}>⬅ Voltar</button>
          <h1>{currentLeague.name}</h1>

          <h2>Tabela</h2>
          <table border={1} cellPadding={5}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Pontos</th>
                <th>J</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>GP</th>
                <th>GC</th>
                <th>SG</th>
              </tr>
            </thead>
            <tbody>
              {calculateStandings(currentLeague).map((s) => (
                <tr key={s.teamId}>
                  <td>{s.teamName}</td>
                  <td>{s.points}</td>
                  <td>{s.gamesPlayed}</td>
                  <td>{s.wins}</td>
                  <td>{s.draws}</td>
                  <td>{s.losses}</td>
                  <td>{s.goalsFor}</td>
                  <td>{s.goalsAgainst}</td>
                  <td>{s.goalDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Partidas</h2>
          {currentLeague.rounds.map((round) => (
            <div key={round.id}>
              <h3>Rodada {round.roundNumber}</h3>
              {round.matches.map((m) => (
                <div key={m.id} style={{ marginBottom: 8 }}>
                  {currentLeague.teams.find((t) => t.id === m.homeTeamId)?.name}{" "}
                  <input
                    type="number"
                    value={m.homeScore ?? ""}
                    onChange={(e) =>
                      handleScoreChange(
                        m.id,
                        Number(e.target.value),
                        m.awayScore ?? 0
                      )
                    }
                    style={{ width: 40 }}
                  />{" "}
                  X{" "}
                  <input
                    type="number"
                    value={m.awayScore ?? ""}
                    onChange={(e) =>
                      handleScoreChange(
                        m.id,
                        m.homeScore ?? 0,
                        Number(e.target.value)
                      )
                    }
                    style={{ width: 40 }}
                  />{" "}
                  {
                    currentLeague.teams.find((t) => t.id === m.awayTeamId)
                      ?.name
                  }
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
