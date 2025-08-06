package com.adryell.future_football.services;

import com.adryell.future_football.models.LeagueParticipant;
import com.adryell.future_football.models.Match;
import com.adryell.future_football.models.Round;
import com.adryell.future_football.models.Standing;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class StandingService {

    public List<Standing> calculateStandings(List<Round> rounds, List<LeagueParticipant> participants) {
        Map<Integer, Standing> standingsMap = new HashMap<>();

        for (LeagueParticipant participant : participants) {
            Standing s = new Standing();
            s.setTeamId(participant.getTeamId());
            s.setTeamName(participant.getTeamName());
            standingsMap.put(participant.getTeamId(), s);
        }

        for (Round round : rounds) {
            for (Match match : round.getMatches()) {
                processMatch(match, standingsMap);
            }
        }

        List<Standing> standings = new ArrayList<>(standingsMap.values());

        standings.sort(Comparator
                .comparingInt(Standing::getPoints).reversed()
                .thenComparingInt(Standing::getGoalDifference).reversed()
                .thenComparingInt(Standing::getGoalsFor).reversed());

        return standings;
    }

    private void processMatch(Match match, Map<Integer, Standing> standingsMap) {
        Standing home = standingsMap.get(match.getHomeTeamId());
        Standing away = standingsMap.get(match.getAwayTeamId());

        if (home == null || away == null) return; // segurança

        int homeGoals = match.getHomeScore();
        int awayGoals = match.getAwayScore();

        home.setGamesPlayed(home.getGamesPlayed() + 1);
        away.setGamesPlayed(away.getGamesPlayed() + 1);

        home.setGoalsFor(home.getGoalsFor() + homeGoals);
        home.setGoalsAgainst(home.getGoalsAgainst() + awayGoals);

        away.setGoalsFor(away.getGoalsFor() + awayGoals);
        away.setGoalsAgainst(away.getGoalsAgainst() + homeGoals);

        if (homeGoals > awayGoals) {
            home.setWins(home.getWins() + 1);
            away.setLosses(away.getLosses() + 1);
            home.setPoints(home.getPoints() + 3);
        } else if (homeGoals < awayGoals) {
            away.setWins(away.getWins() + 1);
            home.setLosses(home.getLosses() + 1);
            away.setPoints(away.getPoints() + 3);
        } else {
            home.setDraws(home.getDraws() + 1);
            away.setDraws(away.getDraws() + 1);
            home.setPoints(home.getPoints() + 1);
            away.setPoints(away.getPoints() + 1);
        }
    }
}
