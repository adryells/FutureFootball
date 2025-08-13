import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../db";
import type { Team, League } from "../db";

export default function CreateLeague() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);

  async function handleCreate() {
    // Salva os times
    const teamIds = await db.teams.bulkAdd(teams, { allKeys: true });

    // Salva o campeonato
    const league: League = {
      name,
      year,
      teamIds: teamIds as number[]
    };
    const leagueId = await db.leagues.add(league);

    // Gera rodadas (futuro) — aqui só redireciona
    navigate(`/league/${leagueId}`);
  }

  function handleAddTeam() {
    if (!teamName.trim()) return;
    setTeams([...teams, { name: teamName.trim() }]);
    setTeamName("");
  }

  return (
    <div>
      <h1>Criar Campeonato</h1>

      <div>
        <label>Nome do Campeonato:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label>Ano:</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </div>

      <hr />

      <h2>Times</h2>
      <div>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Nome do time"
        />
        <button onClick={handleAddTeam}>Adicionar Time</button>
      </div>

      <ul>
        {teams.map((t, i) => (
          <li key={i}>{t.name}</li>
        ))}
      </ul>

      <button
        onClick={handleCreate}
        disabled={name.trim() === "" || teams.length < 3}
      >
        Criar Campeonato
      </button>
    </div>
  );
}
