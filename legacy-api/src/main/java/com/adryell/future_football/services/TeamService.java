package com.adryell.future_football.services;

import com.adryell.future_football.dto.CreateTeamRequestDTO;
import com.adryell.future_football.models.Team;
import com.adryell.future_football.repositories.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public List<Team> findAll() {
        return teamRepository.findAll();
    }

    public Team findById(int id) {
        return teamRepository.findById(id).orElse(null);
    }

    public boolean saveTeam(CreateTeamRequestDTO teamData) {
        Team team = new Team(teamData.getName());
        teamRepository.save(team);
        return true;
    }
}
