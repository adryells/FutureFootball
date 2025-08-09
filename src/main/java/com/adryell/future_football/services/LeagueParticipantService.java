package com.adryell.future_football.services;

import com.adryell.future_football.models.LeagueParticipant;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeagueParticipantService {

    private static final String PARTICIPANTS_FILE_PATH = "data/participants.json";

    public List<LeagueParticipant> findByLeagueId(int leagueId) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            InputStream is = new ClassPathResource(PARTICIPANTS_FILE_PATH).getInputStream();

            List<LeagueParticipant> all = objectMapper.readValue(
                    is,
                    new TypeReference<List<LeagueParticipant>>() {}
            );

            return all.stream()
                    .filter(p -> p.getLeagueId() == leagueId)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
}
