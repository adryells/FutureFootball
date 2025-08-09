package com.adryell.future_football.services;

import com.adryell.future_football.dto.ScoreUpdateDTO;
import com.adryell.future_football.models.Match;
import com.adryell.future_football.models.Round;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.List;

@Service
public class RoundService {

    private static final String ROUNDS_FILE_PATH = "data/rounds.json";

    public List<Round> findByLeagueId(int leagueId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource(ROUNDS_FILE_PATH).getInputStream();
            List<Round> rounds = mapper.readValue(is, new TypeReference<List<Round>>() {});
            return rounds.stream().filter(r -> r.getLeagueId() == leagueId).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public boolean updateScores(int leagueId, int roundNumber, List<ScoreUpdateDTO> scoreUpdates) {
        ObjectMapper mapper = new ObjectMapper();

        try {
            File file = new ClassPathResource(ROUNDS_FILE_PATH).getFile();

            List<Round> allRounds = mapper.readValue(file, new TypeReference<List<Round>>() {});

            Round targetRound = allRounds.stream()
                    .filter(r -> r.getLeagueId() == leagueId && r.getRoundNumber() == roundNumber)
                    .findFirst()
                    .orElse(null);

            if (targetRound == null) {
                return false;
            }

            for (ScoreUpdateDTO scoreUpdate : scoreUpdates) {
                for (Match match : targetRound.getMatches()) {
                    if (match.getId() == scoreUpdate.getMatchId()) {
                        match.setHomeScore(scoreUpdate.getHomeScore());
                        match.setAwayScore(scoreUpdate.getAwayScore());
                    }
                }
            }

            mapper.writerWithDefaultPrettyPrinter().writeValue(file, allRounds);

            return true;

        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }
}
