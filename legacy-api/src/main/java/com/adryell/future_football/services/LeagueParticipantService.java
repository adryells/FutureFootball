package com.adryell.future_football.services;

import com.adryell.future_football.models.League;
import com.adryell.future_football.models.LeagueParticipant;
import com.adryell.future_football.models.Team;
import com.adryell.future_football.repositories.LeagueParticipantRepository;
import com.adryell.future_football.repositories.LeagueRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LeagueParticipantService {

    private final LeagueParticipantRepository participantRepository;
    private final LeagueRepository leagueRepository;

    public LeagueParticipantService(LeagueParticipantRepository participantRepository, LeagueRepository leagueRepository) {
        this.participantRepository = participantRepository;
        this.leagueRepository = leagueRepository;
    }

    public List<LeagueParticipant> findByLeagueId(int leagueId) {
        return participantRepository.findByLeagueId(leagueId);
    }

    public boolean removeTeamFromLeague(int leagueId, int teamId) {
        if (!participantRepository.existsByLeagueIdAndTeamId(leagueId, teamId)) {
            return false;
        }
        participantRepository.deleteByLeagueIdAndTeamId(leagueId, teamId);
        return true;
    }

    public void addParticipants(int leagueId, List<Team> teams) {
        Optional<League> league = leagueRepository.findById(leagueId);

        if (league.isEmpty()){
            return;
        }

        for (Team team : teams) {
            LeagueParticipant participant = new LeagueParticipant();
            participant.setLeague(league.get());
            participant.setTeam(team);
            participantRepository.save(participant);
        }
    }
}
