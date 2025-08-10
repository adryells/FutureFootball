package com.adryell.future_football.services;

import com.adryell.future_football.models.League;
import com.adryell.future_football.repositories.LeagueRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeagueService {

    private final LeagueRepository leagueRepository;

    public LeagueService(LeagueRepository leagueRepository) {
        this.leagueRepository = leagueRepository;
    }

    public List<League> findAll() {
        return leagueRepository.findAll();
    }

    public League findById(int id) {
        return leagueRepository.findById(id).orElse(null);
    }

    public League createLeague(String name, int year) {
        boolean exists = leagueRepository.findByNameIgnoreCaseAndYear(name, year).isPresent();
        if (exists) {
            return null;
        }

        League league = new League();
        league.setName(name);
        league.setYear(year);

        return leagueRepository.save(league);
    }
}
