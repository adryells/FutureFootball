import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../db";
import type { Team, League } from "../db";

export default function LeagueView() {
  const { id } = useParams();
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const league = await db.leagues.get(Number(id));
      if (league) {
        setLeague(league);
        const ts = await db.teams.bulkGet(league.teamIds);
        setTeams(ts.filter((t): t is Team => !!t));
      }
    }
    load();
  }, [id]);

  if (!league) return <p>Carregando...</p>;

  return (
    <div>
      <h1>{league.name} ({league.year})</h1>
      <h2>Times:</h2>
      <ul>
        {teams.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </div>
  );
}
