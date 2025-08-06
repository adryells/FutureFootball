package com.adryell.future_football.services;

import com.adryell.future_football.models.Round;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoundService {

    private static final String ROUNDS_FILE_PATH = "data/rounds.json";

    public List<Round> findByLeagueId(int leagueId) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            InputStream is = new ClassPathResource("data/rounds.json").getInputStream();

            List<Round> allRounds = objectMapper.readValue(
                    is,
                    new TypeReference<List<Round>>() {}
            );

            return allRounds.stream()
                    .filter(round -> round.getLeagueId() == leagueId)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
}
