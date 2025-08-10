package com.adryell.future_football.services;

import com.adryell.future_football.dto.ScoreUpdateDTO;
import com.adryell.future_football.models.League;
import com.adryell.future_football.models.Match;
import com.adryell.future_football.models.Round;
import com.adryell.future_football.models.Team;
import com.adryell.future_football.repositories.LeagueRepository;
import com.adryell.future_football.repositories.MatchRepository;
import com.adryell.future_football.repositories.RoundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RoundService {

    private final RoundRepository roundRepository;
    private final MatchRepository matchRepository;
    private final LeagueRepository leagueRepository;

    public RoundService(RoundRepository roundRepository, MatchRepository matchRepository, LeagueRepository leagueRepository) {
        this.roundRepository = roundRepository;
        this.matchRepository = matchRepository;
        this.leagueRepository = leagueRepository;
    }

    public List<Round> findByLeagueId(int leagueId) {
        return roundRepository.findByLeagueIdOrderByRoundNumberAsc(leagueId);
    }

    @Transactional
    public boolean updateScores(int leagueId, int roundNumber, List<ScoreUpdateDTO> scoreUpdates) {
        Round targetRound = roundRepository.findByLeagueIdAndRoundNumber(leagueId, roundNumber);
        if (targetRound == null) return false;

        List<Match> matches = targetRound.getMatches();
        if (matches == null || matches.isEmpty()) return false;

        boolean updated = false;
        for (ScoreUpdateDTO scoreUpdate : scoreUpdates) {
            for (Match match : matches) {
                if (match.getId() == scoreUpdate.getMatchId()) {
                    match.setHomeScore(scoreUpdate.getHomeScore());
                    match.setAwayScore(scoreUpdate.getAwayScore());
                    match.setPlayed(true);
                    matchRepository.save(match);
                    updated = true;
                    break;
                }
            }
        }
        return updated;
    }

    @Transactional
    public void generateRounds(int leagueId, List<Team> teams) {
        // roundRepository.deleteByLeagueId(leagueId);

        int numTeams = teams.size();
        if (numTeams < 2) return;

        List<Round> roundsToSave = new ArrayList<>();
        int roundNumber = 1;

        int numRounds = numTeams - 1;
        int halfSize = numTeams / 2;

        Optional<League> league = leagueRepository.findById(leagueId);
        if (league.isEmpty()) {
            return;
        }

        for (int i = 0; i < numRounds; i++) {
            Round round = new Round();
            round.setLeague(league.get());
            round.setRoundNumber(roundNumber++);
            round.setMatches(new ArrayList<>());

            for (int j = 0; j < halfSize; j++) {
                Team home = teams.get((i + j) % (numTeams - 1));
                Team away = teams.get((numTeams - 1 - j + i) % (numTeams - 1));
                if (j == 0) away = teams.get(numTeams - 1);

                Match match = new Match();
                match.setHomeTeam(home);
                match.setAwayTeam(away);
                match.setHomeScore(0);
                match.setAwayScore(0);
                match.setRound(round);

                round.getMatches().add(match);
            }
            roundsToSave.add(round);
        }

        int totalRounds = numRounds;
        for (int i = 0; i < totalRounds; i++) {
            Round firstLeg = roundsToSave.get(i);

            Round returnRound = new Round();
            returnRound.setLeague(league.get());
            returnRound.setRoundNumber(roundNumber++);
            returnRound.setMatches(new ArrayList<>());

            for (Match match : firstLeg.getMatches()) {
                Match returnMatch = new Match();
                returnMatch.setHomeTeam(match.getHomeTeam());
                returnMatch.setAwayTeam(match.getAwayTeam());
                returnMatch.setHomeScore(0);
                returnMatch.setAwayScore(0);
                returnMatch.setRound(returnRound);
                returnRound.getMatches().add(returnMatch);
            }
            roundsToSave.add(returnRound);
        }

        roundRepository.saveAll(roundsToSave);
    }
}
