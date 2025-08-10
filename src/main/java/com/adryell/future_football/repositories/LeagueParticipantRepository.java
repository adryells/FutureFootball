package com.adryell.future_football.repositories;

import com.adryell.future_football.models.LeagueParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeagueParticipantRepository extends JpaRepository<LeagueParticipant, Integer> {
    List<LeagueParticipant> findByLeagueId(int leagueId);
    boolean existsByLeagueIdAndTeamId(int leagueId, int teamId);
    void deleteByLeagueIdAndTeamId(int leagueId, int teamId);
}
