package com.adryell.future_football.services;

import com.adryell.future_football.models.League;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
public class LeagueService {

    private static final String LEAGUES_FILE_PATH = "data/leagues.json";

    public List<League> findAll() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource(LEAGUES_FILE_PATH).getInputStream();

            return mapper.readValue(is, new TypeReference<List<League>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public League findById(int id) {
        return findAll().stream()
                .filter(league -> league.getId() == id)
                .findFirst()
                .orElse(null);
    }
}
