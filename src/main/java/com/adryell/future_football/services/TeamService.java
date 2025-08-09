package com.adryell.future_football.services;

import com.adryell.future_football.models.Team;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
public class TeamService {

    private static final String TEAMS_FILE_PATH = "data/teams.json";

    public List<Team> findAll() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource(TEAMS_FILE_PATH).getInputStream();

            return mapper.readValue(is, new TypeReference<List<Team>>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public Team findById(int id) {
        return findAll().stream()
                .filter(team -> team.getId() == id)
                .findFirst()
                .orElse(null);
    }
}
